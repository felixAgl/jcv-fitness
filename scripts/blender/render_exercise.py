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
* A procedural 2-link squat is keyframed onto the rig at run time.
* EEVEE + a compositor Glare (Bloom) node makes the emission read as a glow;
  Blender 4.2+ removed the old EEVEE bloom toggle.
"""

import sys
import os
import argparse
import math

import bpy
from mathutils import Vector, Matrix

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
    p.add_argument("--motion", default="squat", choices=["squat", "curl", "none"])
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


# -------------------------------------------------------------- animation
def _reset_pose(rig):
    for pb in rig.pose.bones:
        pb.matrix_basis = Matrix()


def _rotate_world(rig, bone_name, axis, angle):
    """Rotate a pose bone by `angle` around a WORLD axis passing through its
    own head. Deterministic regardless of the bone's local roll."""
    pb = rig.pose.bones.get(bone_name)
    if pb is None:
        return
    bpy.context.view_layer.update()
    m = pb.matrix.copy()
    head = m.translation.copy()
    R = Matrix.Rotation(angle, 4, axis)
    pb.matrix = Matrix.Translation(head) @ R @ Matrix.Translation(-head) @ m
    bpy.context.view_layer.update()


def _leg_length(rig):
    b = rig.data.bones
    try:
        hip = (rig.matrix_world @ b["upperleg01.L"].head_local)
        knee = (rig.matrix_world @ b["lowerleg01.L"].head_local)
        ankle = (rig.matrix_world @ b["foot.L"].head_local)
    except KeyError:
        return 0.9, 0.45, 0.45
    return (hip - ankle).length, (hip - knee).length, (knee - ankle).length


def _arms_down(rig, front, up, amount=1.0):
    """Take the MakeHuman T-pose down to a natural standing posture."""
    side_axis = -front  # rotating about the back axis lowers the arms
    for side, sign in (("L", 1.0), ("R", -1.0)):
        _rotate_world(rig, f"upperarm01.{side}", side_axis, sign * math.radians(26) * amount)
        _rotate_world(rig, f"lowerarm01.{side}", side_axis, sign * math.radians(8) * amount)
        _rotate_world(rig, f"clavicle.{side}", side_axis, sign * math.radians(4) * amount)


def pose_squat(rig, body, t):
    """t in [0,1]: 0 = standing, 1 = bottom of the squat."""
    front = front_axis(body)
    up = Vector((0, 0, 1))
    flex = front.cross(up).normalized()   # +angle swings a limb forward

    _reset_pose(rig)
    _arms_down(rig, front, up, amount=1.0)

    theta = math.radians(62.0) * t         # hip/knee flexion
    for side in ("L", "R"):
        _rotate_world(rig, f"upperleg01.{side}", flex, theta)
        _rotate_world(rig, f"lowerleg01.{side}", flex, -2.0 * theta)
        _rotate_world(rig, f"foot.{side}", flex, theta)

    # arms reach forward for balance
    for side, sign in (("L", 1.0), ("R", -1.0)):
        _rotate_world(rig, f"upperarm01.{side}", flex, math.radians(30) * t)

    # torso leans forward a little
    for bone in ("spine03", "spine02"):
        _rotate_world(rig, bone, flex, math.radians(-9) * t)

    # drop the whole rig so the feet stay on the floor (2-link kinematics)
    _, l1, l2 = _leg_length(rig)
    rig.location.z = -(l1 + l2) * (1.0 - math.cos(theta))


def pose_curl(rig, body, t):
    front = front_axis(body)
    up = Vector((0, 0, 1))
    flex = front.cross(up).normalized()
    _reset_pose(rig)
    _arms_down(rig, front, up, amount=1.0)
    for side in ("L", "R"):
        _rotate_world(rig, f"lowerarm01.{side}", flex, math.radians(125) * t)
    rig.location.z = 0.0


def build_animation(rig, body, motion, cycle):
    if motion == "none":
        _reset_pose(rig)
        _arms_down(rig, front_axis(body), Vector((0, 0, 1)))
        return
    poser = pose_squat if motion == "squat" else pose_curl
    f_start, f_end = 1, max(2, cycle)
    span = max(1, f_end - f_start)
    bones = [b.name for b in rig.pose.bones]
    # the MakeHuman rig ships with euler bones; normalise BEFORE posing so the
    # keyframes we insert are the channels the bones actually evaluate
    for name in bones:
        rig.pose.bones[name].rotation_mode = "QUATERNION"
    for f in range(f_start, f_end + 1):
        u = (f - f_start) / span
        # ease in/out, down then back up
        t = 0.5 - 0.5 * math.cos(2.0 * math.pi * u)
        bpy.context.scene.frame_set(f)
        poser(rig, body, t)
        for name in bones:
            rig.pose.bones[name].keyframe_insert("rotation_quaternion", frame=f)
        rig.keyframe_insert("location", frame=f)
    log(f"keyframed {motion} over frames {f_start}-{f_end}")


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


def fit_distance(cam, size, margin=1.30, aspect=1080 / 1920):
    tan_v = math.tan(0.5 * 2 * math.atan(cam.data.sensor_height * 0.5 / cam.data.lens))
    tan_h = tan_v * aspect
    dv = (size.z * 0.5) * margin / tan_v
    horiz = max(size.x, size.y)
    dh = (horiz * 0.5) * margin / tan_h
    return max(dv, dh)


_FRAMING = {}


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
    d = fit_distance(cam, size)
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
    build_animation(rig, body, args.motion, args.cycle)

    out_root = os.path.abspath(args.out)
    os.makedirs(out_root, exist_ok=True)
    cam = make_camera("JCV_Cam")
    sc.camera = cam

    views = [v.strip() for v in args.views.split(",") if v.strip()]
    n_frames = f_end - f_start + 1

    # Prime the framing cache from the MID point of the movement (t ~ 0.5) and
    # keep it for every frame: the camera then stays rock-steady while the body
    # moves through it, instead of breathing in and out with the pose.
    sc.frame_set(min(f_end, max(f_start, 1 + args.cycle // 4)))
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
