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
import math

import bpy
from mathutils import Vector, Matrix

# `blender -P` does not put the script's own directory on sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import motion as motion_lib  # noqa: E402

BODY = "JCV_Body"
RIG = "JCV_Rig"
VG_PREFIX = "JCV_"
MASK_ATTR = "muscle_mask"

VIEWS = ["front", "three_quarter", "side", "back", "top", "closeup", "orbit"]


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
                   help="muscle to light up, or 'none'")
    p.add_argument("--views", default="front",
                   help="comma separated: " + ",".join(VIEWS))
    p.add_argument("--frames", default="24",
                   help="single frame '24' or range '1-48'")
    p.add_argument("--out", default="out-3d")
    p.add_argument("--motion", default="squat",
                   help="name of a JSON motion in scripts/blender/motions/ "
                        "(without the extension)")
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
def write_mask(body, muscle):
    mesh = body.data
    for a in list(mesh.color_attributes):
        if a.name == MASK_ATTR:
            mesh.color_attributes.remove(a)
    attr = mesh.color_attributes.new(name=MASK_ATTR, type="FLOAT_COLOR",
                                     domain="POINT")

    weights = [0.0] * len(mesh.vertices)
    if muscle and muscle != "none":
        vg = body.vertex_groups.get(VG_PREFIX + muscle)
        if vg is None:
            raise SystemExit(f"unknown muscle '{muscle}'. "
                             f"available: {', '.join(muscle_names(body))}")
        idx = vg.index
        for v in mesh.vertices:
            for g in v.groups:
                if g.group == idx:
                    weights[v.index] = g.weight
                    break

    for i, w in enumerate(weights):
        attr.data[i].color = (w, w, w, 1.0)
    log(f"mask '{muscle}': {sum(1 for w in weights if w > 0.05)} lit verts")
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


def place_camera(cam, body, view, weights, azimuth_extra=0.0):
    """Frame the body. The framing (centre + fit distance) is computed once per
    view from the live mesh bounds and then cached, so an animated shot does not
    breathe in and out as the pose changes."""
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
    d = fit_distance(cam, size, view_dir=dir_v)
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

    f_start, f_end = parse_frames(args.frames)
    w, h = (int(x) for x in args.res.lower().split("x"))

    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.eevee.taa_render_samples = args.samples
    sc.render.image_settings.file_format = "PNG"
    sc.frame_start, sc.frame_end = f_start, f_end
    setup_glow()

    weights = write_mask(body, args.muscle)
    spec = motion_lib.load_motion(args.motion)
    m_start, m_end = motion_lib.apply_motion(rig, body, spec, args.cycle)
    log(f"motion '{args.motion}' keyframed over frames {m_start}-{m_end}")

    out_root = os.path.abspath(args.out)
    os.makedirs(out_root, exist_ok=True)
    cam = make_camera("JCV_Cam")
    sc.camera = cam

    views = [v.strip() for v in args.views.split(",") if v.strip()]
    n_frames = f_end - f_start + 1

    # Prime the framing cache once, from the UNION of the body bounds over a few
    # sample frames of the movement, and keep it for every frame: the camera then
    # stays rock-steady while the body moves through it, instead of breathing in
    # and out with the pose - and nothing gets cropped at either extreme.
    prime_framing(body, views, m_start, m_end, f_start, f_end)
    for view in views:
        place_camera(cam, body, "three_quarter" if view == "orbit" else view,
                     weights)

    for view in views:
        for f in range(f_start, f_end + 1):
            sc.frame_set(f)
            extra = 0.0
            if view == "orbit" and n_frames > 1:
                u = (f - f_start) / (n_frames - 1)
                extra = -args.orbit_degrees * 0.5 + args.orbit_degrees * u
            place_camera(cam, body, "three_quarter" if view == "orbit" else view,
                         weights, azimuth_extra=extra)
            name = f"{args.muscle}_{view}"
            if n_frames > 1:
                name += f"_{f:04d}"
            sc.render.filepath = os.path.join(out_root, name + ".png")
            bpy.ops.render.render(write_still=True)
            log(f"wrote {sc.render.filepath}")


if __name__ == "__main__":
    main()
