"""
Headless multi-camera / per-muscle-glow renderer for the JCV 24 Fitness
3D exercise prototype.

    blender -b assets/3d/jcv_mannequin.blend -P scripts/blender/render_exercise.py -- \
        --muscle quads --views front,three_quarter,side --frames 1-48 --out out-3d/run1

Key ideas
---------
* `--muscle` writes a per-vertex `muscle_mask` colour attribute from the
  `JCV_<muscle>` vertex group baked by build_scene.py. The material mixes matte
  grey against cyan emission with that mask, so ANY muscle can be lit up with a
  single CLI flag.
* `--exercise-name "<name or id>"` resolves an exercise in the local copy of
  free-exercise-db (public-domain JSON) and glows its primaryMuscles at full
  intensity plus its secondaryMuscles dimmed, via muscle_map.json. `--muscle`
  stays a manual override.
* Cameras are computed from the *evaluated* body bounding box at the render
  frame, so they never break if the mesh, pose or proportions change.
* `--motion <name>` resolves `scripts/blender/motions/<name>.json` and hands it
  to `motion.apply_motion()`, which keyframes it onto the rig at run time.
  Motions are either retargeted mocap (BVH) or analytic. See motions/README.md.
* EEVEE + a compositor Glare (Bloom) node makes the emission read as a glow;
  Blender 4.2+ removed the old EEVEE bloom toggle.
"""

import sys
import os
import argparse
import json
import math
import re

import bpy
from mathutils import Vector, Matrix

# `blender -P` does not put the script's own directory on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPT_DIR)
import motion as motion_lib  # noqa: E402

BODY = "JCV_Body"
RIG = "JCV_Rig"
VG_PREFIX = "JCV_"
MASK_ATTR = "muscle_mask"

VIEWS = ["front", "three_quarter", "side", "back", "top", "closeup", "orbit"]

# free-exercise-db (https://github.com/yuhonas/free-exercise-db, Unlicense /
# public domain -- we use ONLY the JSON metadata, never its images). The local
# copy is gitignored; re-fetch with the curl command in README.md.
EXERCISE_DB = os.environ.get(
    "JCV_EXERCISE_DB",
    os.path.normpath(os.path.join(SCRIPT_DIR, "..", "..", "assets", "3d",
                                  "free-exercise-db", "exercises.json")))
MUSCLE_MAP = os.path.join(SCRIPT_DIR, "muscle_map.json")
SECONDARY_INTENSITY = 0.35


def log(msg):
    print(f"[render] {msg}", flush=True)


# ------------------------------------------------------------------- args
def parse_args(argv):
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    p = argparse.ArgumentParser()
    p.add_argument("--muscle", default="none",
                   help="muscle to light up, or 'none'; manual override that "
                        "wins over --exercise-name")
    p.add_argument("--exercise-name", default=None,
                   help="free-exercise-db exercise (name or id): primary "
                        "muscles glow at full intensity, secondary at "
                        f"{SECONDARY_INTENSITY:.0%}. Needs the gitignored "
                        "exercises.json (see README.md)")
    p.add_argument("--views", default="front",
                   help="comma separated: " + ",".join(VIEWS))
    p.add_argument("--turnaround", action="store_true",
                   help="3D-atlas showcase: mannequin standing at rest, "
                        "camera orbiting a full 360 degrees. Overrides "
                        "--views; defaults --motion to 'none' and --frames "
                        "to 1-144 (6 s at 24 fps). Combine with "
                        "--exercise-name to show an exercise's primary "
                        "muscles at full glow and secondaries dimmed")
    p.add_argument("--frames", default=None,
                   help="single frame '24' or range '1-48' "
                        "(default 24, or 1-144 with --turnaround)")
    p.add_argument("--out", default="out-3d")
    p.add_argument("--motion", default=None,
                   help="name of a JSON motion in scripts/blender/motions/ "
                        "(without the extension; default squat, or none "
                        "with --turnaround)")
    p.add_argument("--samples", type=int, default=48)
    p.add_argument("--res", default="1080x1920")
    p.add_argument("--orbit-degrees", type=float, default=110.0)
    p.add_argument("--rep-frames", type=int, default=48, dest="cycle",
                   help="length in frames of one full rep (named --rep-frames "
                        "because Blender itself grabs anything starting with "
                        "--cycle); the motion is always "
                        "keyframed over 1..cycle so a single-frame render still "
                        "lands somewhere meaningful in the movement")
    p.add_argument("--list-muscles", action="store_true")
    p.add_argument("--list-motions", action="store_true")
    return p.parse_args(argv)


def parse_frames(s):
    if "-" in s:
        a, b = s.split("-", 1)
        return int(a), int(b)
    return int(s), int(s)


# ---------------------------------------------------------------- helpers
def get_objects():
    body = bpy.data.objects.get(BODY)
    rig = bpy.data.objects.get(RIG)
    if body is None or rig is None:
        raise SystemExit("scene.blend must contain JCV_Body and JCV_Rig "
                         "(run scripts/blender/build_scene.py first)")
    return body, rig


def muscle_names(body):
    return sorted(g.name[len(VG_PREFIX):] for g in body.vertex_groups
                  if g.name.startswith(VG_PREFIX))


def front_axis(body):
    """Direction the mannequin faces, stored by build_scene as an object prop
    or re-derived from the head geometry."""
    return Vector((0, -1, 0))


# ------------------------------------------------------------ muscle mask
def resolve_exercise(query):
    """Look `query` up in the local free-exercise-db JSON and return a
    {muscle: intensity} dict via muscle_map.json.

    Primary muscles glow at 1.0, secondary at SECONDARY_INTENSITY; a muscle
    named in both keeps the stronger value. Vocabulary entries mapped to null
    (no vertex group on the mannequin) are skipped with a log line. Our own
    exercise library (public/data/exercise-library.json) has DIFFERENT ids --
    this resolver is Blender-pipeline-only, no bridge is attempted.
    """
    if not os.path.isfile(EXERCISE_DB):
        raise SystemExit(
            f"exercise db not found at {EXERCISE_DB}\n"
            "fetch it with the curl command in scripts/blender/README.md")
    with open(EXERCISE_DB) as fh:
        db = json.load(fh)
    q = query.strip().lower()
    ex = next((e for e in db
               if e.get("id", "").lower() == q
               or e.get("name", "").strip().lower() == q), None)
    if ex is None:
        near = [e["name"] for e in db if q in e.get("name", "").lower()][:8]
        hint = ("close matches: " + "; ".join(near)) if near else \
            "no close matches"
        raise SystemExit(f"exercise '{query}' not found in db ({hint})")

    with open(MUSCLE_MAP) as fh:
        mmap = json.load(fh)["map"]

    intensities = {}
    for muscles, level in ((ex.get("primaryMuscles", []), 1.0),
                           (ex.get("secondaryMuscles", []),
                            SECONDARY_INTENSITY)):
        for m in muscles:
            group = mmap.get(m)
            if group is None:
                why = "no vertex group" if m in mmap else "unknown vocabulary"
                log(f"exercise '{ex['name']}': skipping '{m}' ({why})")
                continue
            intensities[group] = max(intensities.get(group, 0.0), level)
    log(f"exercise '{ex['name']}' ({ex['id']}): "
        + (", ".join(f"{k}={v:.2f}" for k, v in sorted(intensities.items()))
           or "nothing to glow"))
    return ex, intensities


def _mask_object(obj, intensities, strict=True):
    """Write the `muscle_mask` colour attribute on one object from its own
    JCV_<muscle> vertex groups. Returns the per-vertex weights."""
    mesh = obj.data
    for a in list(mesh.color_attributes):
        if a.name == MASK_ATTR:
            mesh.color_attributes.remove(a)
    attr = mesh.color_attributes.new(name=MASK_ATTR, type="FLOAT_COLOR",
                                     domain="POINT")

    def shaped(w):
        # Sharpen the blurred vertex-group feather (was a 0.10..0.55 colour
        # ramp inside the material; moved here so intensity scaling happens
        # AFTER the sharpening and a 0.35 secondary really renders at 0.35).
        t = max(0.0, min(1.0, (w - 0.10) / 0.45))
        return t * t * (3.0 - 2.0 * t)

    weights = [0.0] * len(mesh.vertices)
    for muscle, level in intensities.items():
        vg = obj.vertex_groups.get(VG_PREFIX + muscle)
        if vg is None:
            if strict:
                raise SystemExit(f"unknown muscle '{muscle}'. "
                                 f"available: {', '.join(muscle_names(obj))}")
            continue  # pre-glow-through shorts have no JCV groups
        idx = vg.index
        for v in mesh.vertices:
            for g in v.groups:
                if g.group == idx:
                    weights[v.index] = max(weights[v.index],
                                           shaped(g.weight) * level)
                    break

    for i, w in enumerate(weights):
        attr.data[i].color = (w, w, w, 1.0)
    return weights


def write_mask(body, intensities):
    """Bake {muscle: intensity} into the `muscle_mask` colour attribute.

    Multiple simultaneous glows are supported: each vertex takes the max of
    (vertex-group weight x muscle intensity) over every requested muscle, so a
    bench press can hold pectorals at 1.0 with triceps/deltoids dimmed to 0.35
    in the same render.

    The shorts are masked too: the garment keeps the body's vertex groups
    (build_scene.build_shorts), so covered regions — glutes, adductors, the
    upper quads/hamstrings — glow through the fabric instead of disappearing.
    """
    weights = _mask_object(body, intensities, strict=True)
    shorts = bpy.data.objects.get("JCV_Shorts")
    if shorts is not None:
        _mask_object(shorts, intensities, strict=False)
    label = ", ".join(f"{m}@{lv:.2f}" for m, lv in sorted(intensities.items())) \
        or "none"
    log(f"mask [{label}]: {sum(1 for w in weights if w > 0.05)} lit verts")
    return weights


# ----------------------------------------------------------------- camera
def evaluated_body(body):
    dg = bpy.context.evaluated_depsgraph_get()
    return body.evaluated_get(dg)


def body_bounds(body):
    ev = evaluated_body(body)
    mesh = ev.to_mesh()
    mw = ev.matrix_world
    pts = [mw @ v.co for v in mesh.vertices]
    ev.to_mesh_clear()
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi, (lo + hi) * 0.5, (hi - lo)


def muscle_focus(body, weights):
    """World-space centroid + outward normal of the currently lit muscle."""
    ev = evaluated_body(body)
    mesh = ev.to_mesh()
    mw = ev.matrix_world
    rot = mw.to_3x3()
    acc, nacc, tot = Vector(), Vector(), 0.0
    lo = Vector((1e9,) * 3)
    hi = Vector((-1e9,) * 3)
    for v in mesh.vertices:
        w = weights[v.index] if v.index < len(weights) else 0.0
        if w <= 0.25:
            continue
        p = mw @ v.co
        acc += p * w
        nacc += (rot @ v.normal).normalized() * w
        tot += w
        for i in range(3):
            lo[i] = min(lo[i], p[i])
            hi[i] = max(hi[i], p[i])
    ev.to_mesh_clear()
    if tot <= 0:
        return None
    return acc / tot, nacc.normalized(), (hi - lo)


def make_camera(name):
    cam = bpy.data.objects.get(name)
    if cam is None:
        data = bpy.data.cameras.new(name)
        cam = bpy.data.objects.new(name, data)
        bpy.context.collection.objects.link(cam)
    cam.data.lens = 58.0
    cam.data.sensor_fit = "VERTICAL"
    cam.data.sensor_height = 36.0
    cam.data.clip_start = 0.05
    return cam


def aim(cam, location, target):
    cam.location = location
    direction = (target - location)
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def fit_distance(cam, size, margin=1.12, aspect=1080 / 1920, view_dir=None):
    """Distance at which an axis-aligned box of `size` fits the frame.

    `view_dir` matters more than it looks. Without it the horizontal term has to
    assume the worst case, `max(size.x, size.y)` -- and once the mocap arms
    reach forward, the box gets deep along the camera axis, a depth that is not
    on screen at all drives the fit, and the figure is pushed far away and ends
    up tiny in a 9:16 frame. Given the direction, the on-screen width is the
    box's exact extent along the camera's right vector.
    """
    tan_v = math.tan(0.5 * 2 * math.atan(cam.data.sensor_height * 0.5 / cam.data.lens))
    tan_h = tan_v * aspect
    dv = (size.z * 0.5) * margin / tan_v
    if view_dir is not None:
        right = view_dir.cross(Vector((0, 0, 1)))
        if right.length > 1e-6:
            right.normalize()
            horiz = (abs(right.x) * size.x + abs(right.y) * size.y
                     + abs(right.z) * size.z)
        else:
            horiz = max(size.x, size.y)
    else:
        horiz = max(size.x, size.y)
    dh = (horiz * 0.5) * margin / tan_h
    return max(dv, dh)


_FRAMING = {}


def prime_framing(body, views, m_start, m_end, f_start, f_end, samples=5):
    """Fill the framing cache from the union of the body bounds over `samples`
    frames spread across the motion, clamped to the frames actually rendered.
    A squat is tall at the top and low+wide at the bottom; framing on a single
    frame crops one of the two."""
    sc = bpy.context.scene
    lo_all = Vector((1e9,) * 3)
    hi_all = Vector((-1e9,) * 3)
    span = max(1, m_end - m_start)
    for i in range(samples):
        f = m_start + round(span * i / max(1, samples - 1))
        sc.frame_set(int(min(max(f, min(f_start, m_start)), max(f_end, m_end))))
        lo, hi, _, _ = body_bounds(body)
        for k in range(3):
            lo_all[k] = min(lo_all[k], lo[k])
            hi_all[k] = max(hi_all[k], hi[k])
    center, size = (lo_all + hi_all) * 0.5, (hi_all - lo_all)
    for view in views:
        _FRAMING["three_quarter" if view == "orbit" else view] = (center.copy(),
                                                                  size.copy())
    log(f"framing primed from {samples} frames: size={tuple(round(v,3) for v in size)}")


def place_camera(cam, body, view, weights, azimuth_extra=0.0, lock_fit=False):
    """Frame the body. The framing (centre + fit distance) is computed once per
    view from the live mesh bounds and then cached, so an animated shot does not
    breathe in and out as the pose changes.

    `lock_fit=True` fits the worst-case horizontal extent instead of the
    view-direction extent: a full-circle orbit then keeps ONE distance for
    every azimuth instead of breathing between the wide front and the narrow
    side of the A-pose."""
    front = front_axis(body)
    up = Vector((0, 0, 1))
    if view not in _FRAMING:
        lo, hi, c, s = body_bounds(body)
        _FRAMING[view] = (c.copy(), s.copy())
    center, size = _FRAMING[view]

    if view == "closeup":
        focus = _FRAMING.get("__closeup__") or muscle_focus(body, weights)
        if focus is not None:
            _FRAMING["__closeup__"] = focus
            c, n, msize = focus
            # keep the camera above the horizon and never inside the body
            d_dir = (n + up * 0.18).normalized()
            span = Vector((max(msize.x, 0.12), max(msize.y, 0.12),
                           max(msize.z, 0.12))) * 1.45
            d = fit_distance(cam, span, margin=1.05)
            aim(cam, c + d_dir * d, c)
            return
        view = "three_quarter"

    angles = {"front": 0.0, "three_quarter": 38.0, "side": 90.0, "back": 180.0}
    if view == "top":
        d = fit_distance(cam, size, margin=1.25)
        dir_v = (front * 0.55 + up * 1.05).normalized()
        aim(cam, center + dir_v * d, center)
        return

    az = math.radians(angles.get(view, 0.0) + azimuth_extra)
    dir_v = Matrix.Rotation(az, 4, "Z") @ front
    dir_v = (dir_v + up * 0.075).normalized()
    d = fit_distance(cam, size, view_dir=None if lock_fit else dir_v)
    aim(cam, center + dir_v * d, center + up * size.z * 0.02)


# ------------------------------------------------------------- compositor
def setup_glow(strength=0.55, threshold=1.0, size=8):
    sc = bpy.context.scene
    ng = bpy.data.node_groups.get("JCV_Comp")
    if ng is None:
        # Blender 5.x scene compositing node groups are NOT auto-fed with the
        # render result: the group must read it through a Render Layers node.
        ng = bpy.data.node_groups.new("JCV_Comp", "CompositorNodeTree")
        ng.interface.new_socket("Image", in_out="OUTPUT",
                                socket_type="NodeSocketColor")
        rl = ng.nodes.new("CompositorNodeRLayers")
        rl.location = (-200, 0)
        go = ng.nodes.new("NodeGroupOutput")
        go.location = (600, 0)
        glare = ng.nodes.new("CompositorNodeGlare")
        glare.location = (250, 0)
        glare.inputs["Type"].default_value = "Bloom"
        glare.inputs["Quality"].default_value = "High"
        glare.inputs["Threshold"].default_value = threshold
        glare.inputs["Strength"].default_value = strength
        glare.inputs["Size"].default_value = size / 9.0
        glare.inputs["Smoothness"].default_value = 0.4
        ng.links.new(rl.outputs["Image"], glare.inputs["Image"])
        ng.links.new(glare.outputs["Image"], go.inputs[0])
    sc.compositing_node_group = ng
    sc.render.use_compositing = True


# ------------------------------------------------------------------ main
def main():
    args = parse_args(sys.argv)
    body, rig = get_objects()

    if args.list_muscles:
        print("MUSCLES:", " ".join(muscle_names(body)))
        return
    if args.list_motions:
        print("MOTIONS:", " ".join(motion_lib.available_motions()))
        return

    # --turnaround: standing mannequin, full-circle orbit — the 3D equivalent
    # of the SVG atlas showcase. The flag only fills in defaults, so an
    # explicit --motion (subtle idle) or --frames still wins.
    if args.motion is None:
        args.motion = "none" if args.turnaround else "squat"
    if args.frames is None:
        args.frames = "1-144" if args.turnaround else "24"

    f_start, f_end = parse_frames(args.frames)
    w, h = (int(x) for x in args.res.lower().split("x"))

    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.eevee.taa_render_samples = args.samples
    sc.render.image_settings.file_format = "PNG"
    sc.frame_start, sc.frame_end = f_start, f_end
    setup_glow()

    stem = args.muscle
    if args.muscle and args.muscle != "none":
        if args.exercise_name:
            log(f"--muscle {args.muscle} given: overriding --exercise-name")
        intensities = {args.muscle: 1.0}
    elif args.exercise_name:
        ex, intensities = resolve_exercise(args.exercise_name)
        stem = re.sub(r"[^a-z0-9]+", "-", ex["id"].lower()).strip("-")
    else:
        intensities = {}
    weights = write_mask(body, intensities)
    spec = motion_lib.load_motion(args.motion)
    m_start, m_end = motion_lib.apply_motion(rig, body, spec, args.cycle)
    log(f"motion '{args.motion}' keyframed over frames {m_start}-{m_end}")

    out_root = os.path.abspath(args.out)
    os.makedirs(out_root, exist_ok=True)
    cam = make_camera("JCV_Cam")
    sc.camera = cam

    views = ["turnaround"] if args.turnaround else \
        [v.strip() for v in args.views.split(",") if v.strip()]
    n_frames = f_end - f_start + 1

    def base_view(view):
        return {"orbit": "three_quarter", "turnaround": "front"}.get(view, view)

    # Prime the framing cache once, from the UNION of the body bounds over a few
    # sample frames of the movement, and keep it for every frame: the camera then
    # stays rock-steady while the body moves through it, instead of breathing in
    # and out with the pose - and nothing gets cropped at either extreme.
    prime_framing(body, [base_view(v) for v in views],
                  m_start, m_end, f_start, f_end)
    for view in views:
        place_camera(cam, body, base_view(view), weights,
                     lock_fit=(view == "turnaround"))

    for view in views:
        for f in range(f_start, f_end + 1):
            sc.frame_set(f)
            extra = 0.0
            if view == "orbit" and n_frames > 1:
                u = (f - f_start) / (n_frames - 1)
                extra = -args.orbit_degrees * 0.5 + args.orbit_degrees * u
            elif view == "turnaround" and n_frames > 1:
                # frame N+1 would equal frame 1 -> the clip loops seamlessly
                extra = 360.0 * (f - f_start) / n_frames
            place_camera(cam, body, base_view(view), weights,
                         azimuth_extra=extra,
                         lock_fit=(view == "turnaround"))
            name = f"{stem}_{view}"
            if n_frames > 1:
                name += f"_{f:04d}"
            sc.render.filepath = os.path.join(out_root, name + ".png")
            bpy.ops.render.render(write_still=True)
            log(f"wrote {sc.render.filepath}")


if __name__ == "__main__":
    main()
