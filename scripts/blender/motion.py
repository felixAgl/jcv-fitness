"""
Motion system for the JCV 24 Fitness 3D exercise prototype.

A motion is a JSON file in `scripts/blender/motions/`. Adding exercise #2..N is
config, not code:

    scripts/blender/motions/squat.json      -> mocap, retargeted from CMU BVH
    scripts/blender/motions/curl.json       -> analytic poser
    scripts/blender/motions/none.json       -> rest pose only

Two backends, chosen by the JSON `"type"` field:

* `"bvh"`         import a BVH clip and retarget it onto `JCV_Rig` with
                  world-space rotation deltas. Tolerates the source T-pose vs
                  the MakeHuman A-pose because every bone is driven by the
                  *change* from its own rest orientation, never by an absolute
                  orientation.
* `"procedural"`  analytic poser (hip/knee/ankle/spine angles as functions of a
                  normalised rep phase). No external data, no licence surface.

Source skeletons live in `SKELETONS`; a new mocap source (Mixamo, a different
BVH vendor, …) is a new entry in that dict, not new code.

Public API
----------
    load_motion(name)                     -> dict   (the parsed JSON spec)
    apply_motion(rig, body, spec, cycle)  -> (frame_start, frame_end)
    available_motions()                   -> [str]
"""

import os
import json
import math

import bpy
from mathutils import Vector, Matrix, Quaternion

MOTIONS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "motions")
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),
                                         "..", ".."))


def log(msg):
    print(f"[motion] {msg}", flush=True)


# ===================================================================
# Source-skeleton registry
# ===================================================================
# `bones` maps ONE source bone to a LIST of target bones. Mapping several
# target bones to a single source bone is legal and is how a 1-segment mocap
# limb drives MakeHuman's 2-segment limbs (upperleg01 + upperleg02): each
# target is written as an absolute world orientation, so the rotation is
# applied once, not compounded down the chain.

SKELETONS = {
    "cmu": {
        # CMU BVH is Y-up / -Z-forward; these options land it Z-up facing -Y,
        # which is the same way the MakeHuman mannequin faces.
        "import": {
            "axis_forward": "-Z",
            "axis_up": "Y",
            "global_scale": 1.0,
            "rotate_mode": "NATIVE",
        },
        "root": "Hips",
        # (source, target) bone pair whose head-to-head distance defines the
        # uniform scale between the two skeletons.
        "scale_ref": [["LeftUpLeg", "LeftFoot"], ["upperleg01.L", "foot.L"]],
        # CMU rests in a T-pose, MakeHuman in an A-pose. Without rest alignment
        # the arms carry a permanent 50-120 deg error. `root` is excluded: it is
        # a 1 cm stub whose axis is a rigging convention, not a limb direction,
        # so aligning it would tip the whole body over by 81 deg.
        "align_rest": True,
        "align_exclude": ["Hips"],
        # TARGET bones whose head-to-head vector defines "the way the figure
        # faces", used to cancel the actor's heading.
        "heading_ref": ["upperleg01.L", "upperleg01.R"],
        "bones": {
            "Hips":          ["root"],
            "LowerBack":     ["spine05"],
            "Spine":         ["spine04"],
            "Spine1":        ["spine03", "spine02", "spine01"],
            "Neck":          ["neck01", "neck02"],
            "Neck1":         ["neck03"],
            "Head":          ["head"],

            "LeftUpLeg":     ["upperleg01.L", "upperleg02.L"],
            "LeftLeg":       ["lowerleg01.L", "lowerleg02.L"],
            "LeftFoot":      ["foot.L"],
            "LeftToeBase":   ["toe1-1.L"],
            "RightUpLeg":    ["upperleg01.R", "upperleg02.R"],
            "RightLeg":      ["lowerleg01.R", "lowerleg02.R"],
            "RightFoot":     ["foot.R"],
            "RightToeBase":  ["toe1-1.R"],

            "LeftShoulder":  ["clavicle.L", "shoulder01.L"],
            "LeftArm":       ["upperarm01.L", "upperarm02.L"],
            "LeftForeArm":   ["lowerarm01.L", "lowerarm02.L"],
            "LeftHand":      ["wrist.L"],
            "RightShoulder": ["clavicle.R", "shoulder01.R"],
            "RightArm":      ["upperarm01.R", "upperarm02.R"],
            "RightForeArm":  ["lowerarm01.R", "lowerarm02.R"],
            "RightHand":     ["wrist.R"],
        },
    },
}


# ===================================================================
# Spec loading
# ===================================================================
def available_motions():
    if not os.path.isdir(MOTIONS_DIR):
        return []
    return sorted(f[:-5] for f in os.listdir(MOTIONS_DIR) if f.endswith(".json"))


def load_motion(name):
    path = os.path.join(MOTIONS_DIR, f"{name}.json")
    if not os.path.isfile(path):
        raise SystemExit(f"unknown motion '{name}'. available: "
                         f"{', '.join(available_motions())}")
    with open(path) as fh:
        spec = json.load(fh)
    spec.setdefault("name", name)
    return spec


# ===================================================================
# Shared rig helpers
# ===================================================================
def front_axis(body):
    """Direction the mannequin faces (MakeHuman builds face -Y)."""
    return Vector((0, -1, 0))


def _reset_pose(rig):
    for pb in rig.pose.bones:
        pb.matrix_basis = Matrix()


def _quaternion_mode(rig):
    """The MakeHuman rig ships euler bones; `rotation_quaternion` keyframes are
    silently ignored unless the mode is switched FIRST."""
    for pb in rig.pose.bones:
        pb.rotation_mode = "QUATERNION"


def _rotate_world(rig, bone_name, axis, angle):
    """Rotate a pose bone by `angle` around a WORLD axis through its own head.
    Deterministic regardless of the bone's local roll."""
    pb = rig.pose.bones.get(bone_name)
    if pb is None:
        return
    bpy.context.view_layer.update()
    m = pb.matrix.copy()
    head = m.translation.copy()
    R = Matrix.Rotation(angle, 4, axis)
    pb.matrix = Matrix.Translation(head) @ R @ Matrix.Translation(-head) @ m
    bpy.context.view_layer.update()


def _bone_depth(bone):
    d, b = 0, bone
    while b.parent:
        d += 1
        b = b.parent
    return d


def _rest_world(obj, bone_name):
    return obj.matrix_world @ obj.data.bones[bone_name].matrix_local


GROUND_BONES = ["foot.L", "foot.R", "toe1-1.L", "toe1-1.R"]


def _feet_z(rig, names=GROUND_BONES):
    """Lowest world z of the foot/toe bone endpoints."""
    zs = []
    for n in names:
        pb = rig.pose.bones.get(n)
        if pb is None:
            continue
        m = rig.matrix_world @ pb.matrix
        zs.append(m.translation.z)
        zs.append((m @ Vector((0, pb.bone.length, 0))).z)
    return min(zs) if zs else 0.0


def _lowest_z(body):
    """Lowest point of the EVALUATED body mesh, in world space."""
    dg = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(dg)
    mesh = ev.to_mesh()
    mw = ev.matrix_world
    z = min((mw @ v.co).z for v in mesh.vertices) if len(mesh.vertices) else 0.0
    ev.to_mesh_clear()
    return z


def _foot_points(rig, names=GROUND_BONES):
    pts = []
    for n in names:
        pb = rig.pose.bones.get(n)
        if pb is None:
            continue
        m = rig.matrix_world @ pb.matrix
        pts.append(m.translation.copy())
        pts.append(m @ Vector((0, pb.bone.length, 0)))
    return pts


def _feet_lowest_z(rig, body, radius=0.18):
    """Lowest evaluated vertex that belongs to a FOOT, found geometrically
    (proximity to the foot/toe bones) rather than by vertex index: JCV_Body
    carries a MASK modifier that drops the MakeHuman helper geometry, so
    original and evaluated vertex indices do not line up."""
    pts = _foot_points(rig)
    if not pts:
        return 0.0
    r2 = radius * radius
    dg = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(dg)
    mesh = ev.to_mesh()
    mw = ev.matrix_world
    best = 1e9
    for v in mesh.vertices:
        p = mw @ v.co
        if p.z >= best:
            continue                       # cheap early-out: most verts are high
        for e in pts:
            if (p - e).length_squared < r2:
                best = p.z
                break
    ev.to_mesh_clear()
    return 0.0 if best > 1e8 else best


# ===================================================================
# Keyframe writer
# ===================================================================
def _make_ground_clamp(rig, body, mode):
    """Return a function that offsets `rig.location.z` so the figure stands on
    z=0, or None. Two modes:

    `"feet"`  (default) clamps on the evaluated mesh vertices skinned to the
              foot and toe bones. This is what you want: at the bottom of a
              squat the LOWEST MESH POINT is the glutes, so a whole-mesh clamp
              silently lifts the feet off the floor and the figure hovers.
    `"bones"` clamps on the foot/toe bone endpoints plus the sole thickness
              measured at rest. Free, but 2-6 cm of the sole sinks through the
              floor once the ankle pitches, because the offset is a constant.
    `"mesh"`  clamps on the lowest vertex of the whole body. Correct for
              motions where something other than the feet legitimately touches
              down (push-ups, floor work).
    """
    if not mode:
        return None
    if mode is True:
        mode = "feet"
    if mode == "mesh":
        return lambda: _lowest_z(body)
    if mode == "bones":
        sole = _feet_z(rig) - _lowest_z(body)   # sampled at the current (rest) pose
        return lambda: _feet_z(rig) - sole
    if mode != "feet":
        raise SystemExit("ground_clamp must be false, 'feet', 'bones' or 'mesh', "
                         f"got {mode!r}")
    rest = _feet_lowest_z(rig, body)
    log(f"ground_clamp 'feet': sole sits at z={rest:+.4f} in the rest pose")
    return lambda: _feet_lowest_z(rig, body)


def _write_frames(rig, poses, f_start):
    """`poses` is a list of (rig_location, {bone_name: Quaternion}) per output
    frame. Written in a second pass so that scrubbing the scene during capture
    (which the BVH backend has to do) can never fight the keys we insert."""
    names = [pb.name for pb in rig.pose.bones]
    if rig.animation_data and rig.animation_data.action:
        rig.animation_data.action = None
    # only rotation is keyed, so any residual bone-local translation/scale left
    # over from the capture pass would otherwise be frozen into every frame
    for pb in rig.pose.bones:
        pb.location = (0.0, 0.0, 0.0)
        pb.scale = (1.0, 1.0, 1.0)
    for i, (loc, quats) in enumerate(poses):
        f = f_start + i
        for n in names:
            pb = rig.pose.bones[n]
            pb.rotation_quaternion = quats.get(n, Quaternion((1, 0, 0, 0)))
            pb.keyframe_insert("rotation_quaternion", frame=f)
        rig.location = loc
        rig.keyframe_insert("location", frame=f)
    return f_start, f_start + len(poses) - 1


def _capture(rig):
    return {pb.name: pb.matrix_basis.to_quaternion() for pb in rig.pose.bones}


# ===================================================================
# Backend: BVH retarget
# ===================================================================
def _import_bvh(path, skel):
    opts = dict(skel.get("import", {}))
    before = set(bpy.data.objects.keys())
    bpy.ops.import_anim.bvh(
        filepath=path,
        frame_start=1,
        use_fps_scale=False,
        update_scene_fps=False,
        update_scene_duration=False,
        **opts,
    )
    new = [k for k in bpy.data.objects.keys() if k not in before]
    if not new:
        raise SystemExit(f"BVH import produced no object: {path}")
    return bpy.data.objects[new[0]]


def _discard(src):
    act = None
    if src.animation_data:
        act = src.animation_data.action
    data = src.data
    bpy.data.objects.remove(src, do_unlink=True)
    if data.users == 0:
        bpy.data.armatures.remove(data)
    if act is not None and act.users == 0:
        bpy.data.actions.remove(act)


def _skeleton_scale(src, rig, skel):
    (sa, sb), (ta, tb) = skel["scale_ref"]
    s = ((_rest_world(src, sa).translation - _rest_world(src, sb).translation).length)
    t = ((_rest_world(rig, ta).translation - _rest_world(rig, tb).translation).length)
    if s <= 1e-6:
        return 1.0
    return t / s


def _apply_bvh(rig, body, spec, cycle):
    skel_name = spec.get("skeleton", "cmu")
    skel = SKELETONS.get(skel_name)
    if skel is None:
        raise SystemExit(f"unknown skeleton '{skel_name}'. "
                         f"known: {', '.join(sorted(SKELETONS))}")

    src_cfg = spec["source"]
    path = src_cfg["file"]
    if not os.path.isabs(path):
        path = os.path.join(REPO_ROOT, path)
    if not os.path.isfile(path):
        raise SystemExit(
            f"motion '{spec['name']}' needs {path}, which is not present.\n"
            f"    dataset: {src_cfg.get('dataset', '?')}  {src_cfg.get('url', '')}\n"
            f"    (assets/3d is gitignored - re-download the clip)")

    src = _import_bvh(path, skel)
    try:
        return _retarget(rig, body, src, skel, spec, cycle)
    finally:
        _discard(src)


def _retarget(rig, body, src, skel, spec, cycle):
    scene = bpy.context.scene
    rng = spec.get("range", {})
    src_start = float(rng.get("start", 1))
    src_end = float(rng.get("end", src.animation_data.action.frame_range[1]))
    loop = bool(spec.get("loop", True))

    if rng.get("fit_cycle", True):
        n_out = max(2, int(cycle))
    else:
        step = float(rng.get("step", 1)) or 1.0
        n_out = max(2, int(round((src_end - src_start) / step)) + 1)
    denom = n_out if loop else max(1, n_out - 1)
    src_frames = [src_start + (src_end - src_start) * (i / denom)
                  for i in range(n_out)]

    root_cfg = spec.get("root", {})
    lock_xy = bool(root_cfg.get("lock_xy", True))
    height_mode = root_cfg.get("root_height", "follow")
    influence = spec.get("influence", {})

    _reset_pose(rig)
    rig.location = Vector((0, 0, 0))
    bpy.context.view_layer.update()
    clamp = _make_ground_clamp(rig, body, root_cfg.get("ground_clamp", "feet"))

    scale = _skeleton_scale(src, rig, skel)
    root_name = skel["root"]
    align = bool(spec.get("align_rest", skel.get("align_rest", True)))
    exclude = set(skel.get("align_exclude", []))

    # rest orientations, captured ONCE
    pairs = []           # (src_bone, target_bone, T_ref_3x3)
    for s_name, t_names in skel["bones"].items():
        if s_name not in src.data.bones:
            continue
        s_rest = _rest_world(src, s_name).to_3x3()
        for t_name in t_names:
            if t_name not in rig.data.bones:
                continue
            t_ref = _rest_world(rig, t_name).to_3x3()
            if align and s_name not in exclude:
                # Snap the target bone's REST DIRECTION onto the source's, so
                # that "source at rest" means "target at rest" for real. This is
                # what makes an A-pose target usable with a T-pose source
                # without hand-authoring a correction per bone.
                d_t = (t_ref @ Vector((0, 1, 0))).normalized()
                d_s = (s_rest @ Vector((0, 1, 0))).normalized()
                t_ref = d_t.rotation_difference(d_s).to_matrix() @ t_ref
            pairs.append((s_name, t_name, t_ref))
    # parents first: pose_bone.matrix is a world-space setter resolved against
    # the CURRENT parent state, so a child written before its parent is wrong.
    pairs.sort(key=lambda p: _bone_depth(rig.data.bones[p[1]]))
    src_rest = {s: _rest_world(src, s).to_3x3().inverted()
                for s, _, _ in pairs}
    src_root_rest_t = _rest_world(src, root_name).translation.copy()
    rig_inv = rig.matrix_world.to_3x3().inverted()

    # The actor does not necessarily face the same way as the BVH rest pose
    # (subject 22 stands ~76 deg off). Cancel the heading ONCE, at the reference
    # frame, so the mannequin faces the camera; any heading CHANGE during the
    # clip still comes through.
    yaw = Matrix.Identity(3)
    if spec.get("align_facing", True):
        scene.frame_set(int(src_start))
        rd = ((src.matrix_world @ src.pose.bones[root_name].matrix).to_3x3()
              @ src_rest[root_name])
        hl, hr = skel.get("heading_ref", ["upperleg01.L", "upperleg01.R"])
        # A hip-to-hip VECTOR, not a quaternion twist: swing-twist decomposition
        # about Z flips sign when the pelvis is tilted, which silently turns the
        # figure 180 deg and renders its back to the camera.
        t_right = (_rest_world(rig, hr).translation
                   - _rest_world(rig, hl).translation)
        t_right.z = 0.0
        v = rd @ t_right
        v.z = 0.0
        if t_right.length > 1e-5 and v.length > 1e-5:
            yaw = Matrix.Rotation(math.atan2(t_right.y, t_right.x)
                                  - math.atan2(v.y, v.x), 3, "Z")

    log(f"retarget '{spec['name']}': {len(pairs)} bone pairs, scale {scale:.4f}, "
        f"src {src_start:.0f}-{src_end:.0f} -> {n_out} frames, "
        f"align_rest={align}, yaw_fix={math.degrees(yaw.to_euler().z):.1f} deg")

    _quaternion_mode(rig)
    poses = []
    for f in src_frames:
        i = int(math.floor(f))
        scene.frame_set(i, subframe=float(f - i))

        _reset_pose(rig)
        for s_name, t_name, t_rest in pairs:
            s_world = (src.matrix_world @ src.pose.bones[s_name].matrix).to_3x3()
            r_delta = yaw @ s_world @ src_rest[s_name]
            want = (rig_inv @ r_delta @ t_rest).to_quaternion().to_matrix()
            pb = rig.pose.bones[t_name]
            bpy.context.view_layer.update()
            pb.matrix = Matrix.Translation(pb.matrix.translation) @ want.to_4x4()
            bpy.context.view_layer.update()

        for name, inf in influence.items():
            pb = rig.pose.bones.get(name)
            if pb is not None:
                q = pb.matrix_basis.to_quaternion()
                pb.matrix_basis = (Quaternion((1, 0, 0, 0))
                                   .slerp(q, float(inf))).to_matrix().to_4x4()

        # ---- root translation
        t_now = (src.matrix_world @ src.pose.bones[root_name].matrix).translation
        d = yaw @ ((t_now - src_root_rest_t) * scale)
        loc = Vector((0.0, 0.0, 0.0))
        if height_mode == "follow":
            loc.z = d.z
        if not lock_xy:
            loc.x, loc.y = d.x, d.y
        rig.location = loc
        bpy.context.view_layer.update()

        if clamp is not None:
            loc.z -= clamp()
            rig.location = loc
            bpy.context.view_layer.update()

        poses.append((loc.copy(), _capture(rig)))

    return _write_frames(rig, poses, 1)


# ===================================================================
# Backend: procedural
# ===================================================================
def _ease(u):
    """Down-and-up over u in [0,1] with a soft hold at both ends."""
    return 0.5 - 0.5 * math.cos(2.0 * math.pi * u)


def _leg_links(rig):
    b = rig.data.bones
    try:
        hip = rig.matrix_world @ b["upperleg01.L"].head_local
        knee = rig.matrix_world @ b["lowerleg01.L"].head_local
        ankle = rig.matrix_world @ b["foot.L"].head_local
    except KeyError:
        return 0.45, 0.45
    return (hip - knee).length, (knee - ankle).length


def _arms_down(rig, front, amount=1.0):
    """Relax the MakeHuman A-pose into a natural standing posture."""
    side_axis = -front
    for side, sign in (("L", 1.0), ("R", -1.0)):
        _rotate_world(rig, f"upperarm01.{side}", side_axis, sign * math.radians(26) * amount)
        _rotate_world(rig, f"lowerarm01.{side}", side_axis, sign * math.radians(8) * amount)
        _rotate_world(rig, f"clavicle.{side}", side_axis, sign * math.radians(4) * amount)


def _pose_squat(rig, body, t, p):
    """t in [0,1]: 0 = standing, 1 = bottom of the squat."""
    front = front_axis(body)
    up = Vector((0, 0, 1))
    flex = front.cross(up).normalized()      # +angle swings a limb forward

    _reset_pose(rig)
    _arms_down(rig, front, 1.0)

    hip = math.radians(p.get("hip_deg", 66.0)) * t
    knee = math.radians(p.get("knee_deg", 118.0)) * t
    ankle = math.radians(p.get("ankle_deg", 26.0)) * t
    for side in ("L", "R"):
        _rotate_world(rig, f"upperleg01.{side}", flex, hip)
        _rotate_world(rig, f"lowerleg01.{side}", flex, -knee)
        _rotate_world(rig, f"foot.{side}", flex, knee - hip - ankle)

    # torso hinges forward over the hips to keep the centre of mass over the feet
    for bone, w in (("spine05", 0.35), ("spine04", 0.3), ("spine03", 0.25)):
        _rotate_world(rig, bone, flex, math.radians(p.get("spine_deg", -34.0)) * w * t)
    # head stays level-ish
    _rotate_world(rig, "neck02", flex, math.radians(-p.get("spine_deg", -34.0)) * 0.45 * t)

    # arms counterbalance forward
    for side in ("L", "R"):
        _rotate_world(rig, f"upperarm01.{side}", flex, math.radians(p.get("arm_deg", 62.0)) * t)
        _rotate_world(rig, f"lowerarm01.{side}", flex, math.radians(-14.0) * t)

    l1, l2 = _leg_links(rig)
    rig.location.z = -(l1 + l2) * (1.0 - math.cos(0.5 * (hip + knee - hip)))


def _pose_curl(rig, body, t, p):
    front = front_axis(body)
    _reset_pose(rig)
    _arms_down(rig, front, 1.0)
    up = Vector((0, 0, 1))
    flex = front.cross(up).normalized()
    for side in ("L", "R"):
        _rotate_world(rig, f"lowerarm01.{side}", flex, math.radians(p.get("elbow_deg", 125.0)) * t)
    # small torso sway on the concentric
    _rotate_world(rig, "spine04", flex, math.radians(p.get("spine_deg", -5.0)) * t)
    rig.location.z = 0.0


POSERS = {"squat": _pose_squat, "curl": _pose_curl}


def _apply_procedural(rig, body, spec, cycle):
    poser = POSERS.get(spec.get("poser"))
    if poser is None:
        raise SystemExit(f"unknown procedural poser '{spec.get('poser')}'. "
                         f"known: {', '.join(sorted(POSERS))}")
    params = spec.get("params", {})
    n_out = max(2, int(cycle))
    _quaternion_mode(rig)
    _reset_pose(rig)
    rig.location = Vector((0, 0, 0))
    bpy.context.view_layer.update()
    clamp = _make_ground_clamp(rig, body, spec.get("root", {}).get("ground_clamp", False))
    poses = []
    for i in range(n_out):
        t = _ease(i / n_out if spec.get("loop", True) else i / (n_out - 1))
        poser(rig, body, t, params)
        bpy.context.view_layer.update()
        if clamp is not None:
            rig.location.z -= clamp()
            bpy.context.view_layer.update()
        poses.append((rig.location.copy(), _capture(rig)))
    log(f"procedural '{spec['name']}' ({spec.get('poser')}) over {n_out} frames")
    return _write_frames(rig, poses, 1)


# ===================================================================
# Backend: rest
# ===================================================================
def _apply_rest(rig, body, spec, cycle):
    _quaternion_mode(rig)
    _reset_pose(rig)
    if spec.get("arms_down", True):
        _arms_down(rig, front_axis(body), 1.0)
    rig.location = Vector((0, 0, 0))
    bpy.context.view_layer.update()
    return _write_frames(rig, [(rig.location.copy(), _capture(rig))], 1)


# ===================================================================
# Entry point
# ===================================================================
BACKENDS = {
    "bvh": _apply_bvh,
    "procedural": _apply_procedural,
    "rest": _apply_rest,
}


def apply_motion(rig, body, spec, cycle):
    """Keyframe `spec` onto `rig`. Returns (frame_start, frame_end)."""
    backend = BACKENDS.get(spec.get("type"))
    if backend is None:
        raise SystemExit(f"motion '{spec.get('name')}' has unknown type "
                         f"'{spec.get('type')}'. known: {', '.join(sorted(BACKENDS))}")
    src = spec.get("source") or {}
    if src.get("licence"):
        log(f"{spec['name']}: {src.get('dataset', 'source')} - {src['licence']}")
    return backend(rig, body, spec, cycle)
