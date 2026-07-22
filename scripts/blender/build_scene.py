"""
Build the JCV 24 Fitness 3D mannequin scene (headless).

Generates a rigged CC0 human with MPFB2 (MakeHuman for Blender), shapes it into
an athletic physique, abstracts the head into a featureless mannequin head,
models fitted shorts procedurally, bakes named muscle-region vertex groups onto
it, sets up the dark-studio look and saves a .blend asset that
`render_exercise.py` consumes.

Usage:
    BLENDER_USER_EXTENSIONS=<ext-dir> blender -b -P scripts/blender/build_scene.py -- \
        --out assets/3d/jcv_mannequin.blend

MPFB2 is GPLv3 code, but every asset it generates is CC0 (public domain). The
shorts are modelled from the body's own geometry, so they inherit the same
licence. No third-party asset is downloaded or embedded.
See scripts/blender/README.md for how to install it.
"""

import sys
import os
import argparse
import importlib
import math

import bpy
import bmesh
from mathutils import Vector

MPFB_MODULE = os.environ.get("MPFB_MODULE", "bl_ext.user_default.mpfb")

# --------------------------------------------------------------------------
# Muscle definitions.
#
# Every region is defined RELATIVE TO THE RIG (bone segments + surface normal
# direction), never in absolute world coordinates, so it survives a change of
# body proportions.
#
#   bones : rest bones whose segment "owns" the region
#   t     : (min, max) normalised position along the bone segment
#   dir   : required surface direction, in body-space
#             front / back / up / down / out (lateral, away from the midline)
#   dot   : minimum dot product between vertex normal and that direction
#   side_dot : optional, minimum |normal . lateral| so a region can be limited
#              to the sides of the body (used to carve the lats off the spine)
#   radius: max distance to the bone segment, as a multiple of body height
# --------------------------------------------------------------------------
MUSCLES = {
    "pectorals":  dict(bones=["breast.L", "breast.R"],
                       t=(0.0, 1.0), dir="front", dot=0.30, radius=0.095),
    "lats":       dict(bones=["spine02", "spine03"],
                       t=(0.0, 0.95), dir="back", dot=0.05, radius=0.155,
                       side_dot=0.40),
    "deltoids":   dict(bones=["shoulder01.L", "shoulder01.R",
                              "upperarm01.L", "upperarm01.R"],
                       t=(0.0, 0.32), dir="any", dot=0.0, radius=0.058),
    "biceps":     dict(bones=["upperarm01.L", "upperarm02.L",
                              "upperarm01.R", "upperarm02.R"],
                       t=(0.22, 1.0), dir="front", dot=0.15, radius=0.048),
    "triceps":    dict(bones=["upperarm01.L", "upperarm02.L",
                              "upperarm01.R", "upperarm02.R"],
                       t=(0.18, 1.0), dir="back", dot=0.15, radius=0.048),
    # NB: the MakeHuman spine is numbered top-down, spine05 sits at the pelvis
    "abs":        dict(bones=["spine04", "spine05"],
                       t=(0.0, 1.0), dir="front", dot=0.35, radius=0.105),
    "quads":      dict(bones=["upperleg01.L", "upperleg02.L",
                              "upperleg01.R", "upperleg02.R"],
                       t=(0.10, 1.0), dir="front", dot=0.05, radius=0.10),
    "hamstrings": dict(bones=["upperleg01.L", "upperleg02.L",
                              "upperleg01.R", "upperleg02.R"],
                       t=(0.30, 1.0), dir="back", dot=0.10, radius=0.095),
    "glutes":     dict(bones=["upperleg01.L", "upperleg01.R"],
                       t=(0.0, 0.22), dir="back", dot=0.05, radius=0.115),
    "calves":     dict(bones=["lowerleg01.L", "lowerleg02.L",
                              "lowerleg01.R", "lowerleg02.R"],
                       t=(0.0, 0.75), dir="back", dot=0.05, radius=0.075),
}

MUSCLE_NAMES = sorted(MUSCLES)
VG_PREFIX = "JCV_"
HEAD_VG = "JCV_HeadMask"

BRAND_CYAN = (0.133, 0.827, 0.933)   # #22d3ee, linear-ish
BG_COLOR = (0.0039, 0.0039, 0.0039)  # ~#0a0a0a
GRAPHITE = (0.0230, 0.0255, 0.0310)  # shorts fabric


# --------------------------------------------------------------------------
# Physique.
#
# MPFB2 ships the whole MakeHuman target library under data/targets/. Each
# entry below is a `<name>.target.gz` file resolved by
# TargetService.target_full_path() and loaded as a shape key; the whole stack is
# then baked into the mesh so the result is plain geometry.
#
# The macro dict controls the *body type* (gender / muscle / weight / ...) on a
# 0..1 scale; the detail targets sculpt the trained-lifter silhouette on top of
# it: V-taper, thick delts/arms/legs, tight waist, hard abs.
# --------------------------------------------------------------------------
def athletic_targets(intensity=1.0):
    k = intensity
    pairs = [
        # ---- torso: V-taper + chest/back thickness, tight waist
        ("torso-vshape-incr",              0.80),
        ("torso-muscle-pectoral-incr",     0.70),
        ("torso-muscle-dorsi-incr",        0.65),
        ("measure-shoulder-dist-incr",     0.45),
        ("measure-bust-circ-incr",         0.35),
        ("measure-underbust-circ-decr",    0.30),
        ("measure-waist-circ-decr",        0.55),
        ("stomach-tone-incr",              1.00),
        ("stomach-navel-in",               0.30),
        # ---- neck / traps
        ("measure-neck-circ-incr",         0.55),
        # ---- arms
        ("l-upperarm-muscle-incr",         0.80),
        ("r-upperarm-muscle-incr",         0.80),
        ("l-upperarm-shoulder-muscle-incr", 0.75),
        ("r-upperarm-shoulder-muscle-incr", 0.75),
        ("l-lowerarm-muscle-incr",         0.70),
        ("r-lowerarm-muscle-incr",         0.70),
        ("measure-upperarm-circ-incr",     0.35),
        # ---- legs / glutes
        ("l-upperleg-muscle-incr",         0.90),
        ("r-upperleg-muscle-incr",         0.90),
        ("l-lowerleg-muscle-incr",         0.85),
        ("r-lowerleg-muscle-incr",         0.85),
        ("buttocks-volume-incr",           0.50),
        # ---- keep the body fat visually low so the shapes read
        ("l-upperarm-fat-decr",            0.60),
        ("r-upperarm-fat-decr",            0.60),
        ("l-upperleg-fat-decr",            0.45),
        ("r-upperleg-fat-decr",            0.45),
    ]
    return [{"target": n, "value": min(1.0, v * k)} for n, v in pairs]


# Shrink the facial landmarks the Laplacian pass cannot fully melt (ears stick
# out of the silhouette, the nose out of the profile).
FEATURELESS_TARGETS = [
    {"target": "l-ear-scale-decr",     "value": 1.0},
    {"target": "r-ear-scale-decr",     "value": 1.0},
    {"target": "nose-scale-depth-decr", "value": 1.0},
    {"target": "nose-scale-horiz-decr", "value": 0.8},
    {"target": "nose-scale-vert-decr",  "value": 0.6},
    {"target": "head-oval",             "value": 0.5},
]


# ---------------------------------------------------------------- utilities
def log(msg):
    print(f"[build_scene] {msg}", flush=True)


def parse_args(argv):
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []
    p = argparse.ArgumentParser()
    p.add_argument("--out", default="assets/3d/jcv_mannequin.blend")
    p.add_argument("--gender", type=float, default=0.95,
                   help="0 = female, 1 = male")
    p.add_argument("--muscle", type=float, default=1.0,
                   help="macro muscle 0..1 (1.0 = maximum)")
    p.add_argument("--weight", type=float, default=0.60,
                   help="macro weight 0..1; slightly above average adds mass "
                        "without softening the shapes")
    p.add_argument("--athletic", type=float, default=1.0,
                   help="scale applied to the whole detail-target stack")
    p.add_argument("--no-shorts", dest="shorts", action="store_false")
    p.add_argument("--no-abstract-head", dest="abstract_head",
                   action="store_false")
    p.add_argument("--head-smooth", type=int, default=40,
                   help="Laplacian iterations used to melt the face")
    p.add_argument("--no-floor", dest="floor", action="store_false",
                   help="drop the ground plane / contact shadow")
    p.set_defaults(shorts=True, abstract_head=True, floor=True)
    return p.parse_args(argv)


def wipe_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def enable_mpfb():
    try:
        bpy.ops.preferences.addon_enable(module=MPFB_MODULE)
    except Exception as exc:  # pragma: no cover - env specific
        raise SystemExit(
            f"Could not enable MPFB2 module '{MPFB_MODULE}': {exc}\n"
            "See scripts/blender/README.md for installation instructions."
        )


def mpfb_services():
    """MPFB2's python API. Driving the services directly (instead of the
    `mpfb.create_human` operator) is what lets us pass *continuous* macro values
    and stack the MakeHuman detail targets on top."""
    services = importlib.import_module(MPFB_MODULE + ".services")
    return services.HumanService, services.TargetService


# ------------------------------------------------------------- body + rig
def _select_only(obj):
    bpy.context.view_layer.objects.active = obj
    for o in bpy.data.objects:
        o.select_set(o is obj)


def create_body(args):
    HumanService, TargetService = mpfb_services()

    macro = TargetService.get_default_macro_info_dict()
    macro["race"] = {"african": 0.33, "asian": 0.33, "caucasian": 0.33}
    macro["gender"] = args.gender
    macro["age"] = 0.5            # young adult
    macro["muscle"] = args.muscle
    macro["weight"] = args.weight
    macro["height"] = 0.62        # a touch tall reads as athletic
    macro["proportions"] = 0.75   # "idealised" proportions
    macro["cupsize"] = 0.5
    macro["firmness"] = 0.5
    log(f"macro: muscle={macro['muscle']:.2f} weight={macro['weight']:.2f} "
        f"gender={macro['gender']:.2f}")

    body = HumanService.create_human(feet_on_ground=True, scale=0.1,
                                     macro_detail_dict=macro)
    body.name = "JCV_Body"
    body.use_shape_key_edit_mode = True

    stack = athletic_targets(args.athletic)
    if args.abstract_head:
        stack = stack + FEATURELESS_TARGETS
    TargetService.bulk_load_targets(body, stack)
    log(f"loaded {len(stack)} detail targets")

    # Freeze the whole shape-key stack into real geometry: everything after this
    # point (head smoothing, shorts, rig fitting, muscle masks) then works on
    # coordinates that are actually what gets rendered.
    TargetService.bake_targets(body)
    return body


def add_rig(body):
    sc = bpy.context.scene
    _select_only(body)
    sc.MPFB_ADR_standard_rig = "default_no_toes"
    sc.MPFB_ADR_import_weights = True
    bpy.ops.mpfb.add_standard_rig()
    rig = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    rig.name = "JCV_Rig"
    log(f"body={len(body.data.vertices)} verts  rig={len(rig.data.bones)} bones")
    return rig


# ------------------------------------------------------------ head abstract
def _verts_in_groups(body, names):
    """Set of vertex indices belonging to any of the named vertex groups."""
    idx = {body.vertex_groups[n].index for n in names if n in body.vertex_groups}
    if not idx:
        return set()
    out = set()
    for v in body.data.vertices:
        if any(g.group in idx for g in v.groups):
            out.add(v.index)
    return out


def _smoothstep(a, b, x):
    if b <= a:
        return 1.0 if x >= b else 0.0
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3.0 - 2.0 * t)


def _ovoid_head(mesh, weights, strength=0.8):
    """Blend the weighted head vertices towards the ellipsoid that hugs them."""
    core = [i for i, w in weights.items() if w > 0.55]
    if len(core) < 32:
        return
    pts = [mesh.vertices[i].co for i in core]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    centre = (lo + hi) * 0.5
    radii = Vector((max((hi.x - lo.x) * 0.5, 1e-4),
                    max((hi.y - lo.y) * 0.5, 1e-4),
                    max((hi.z - lo.z) * 0.5, 1e-4)))
    for i, w in weights.items():
        v = mesh.vertices[i]
        d = v.co - centre
        # normalised position on the unit sphere in ellipsoid space
        n = Vector((d.x / radii.x, d.y / radii.y, d.z / radii.z))
        if n.length < 1e-6:
            continue
        n.normalize()
        target = centre + Vector((n.x * radii.x, n.y * radii.y, n.z * radii.z))
        v.co = v.co.lerp(target, w * strength)


def abstract_head(body, iterations=14):
    """Melt the face into a smooth mannequin head.

    A weighted vertex group (1 over the face/skull, feathered to 0 at the neck)
    drives a volume-preserving Laplacian Smooth modifier, which is then applied.
    Helper geometry and the rig's joint cubes are excluded so the rig still fits
    the body afterwards.
    """
    mesh = body.data
    skip = _verts_in_groups(body, ("JointCubes", "HelperGeometry"))
    skin = [v for v in mesh.vertices if v.index not in skip]
    if not skin:
        return
    z_top = max(v.co.z for v in skin)

    neck = _verts_in_groups(body, ("joint-neck",))
    if neck:
        z_neck = sum(mesh.vertices[i].co.z for i in neck) / len(neck)
    else:                                    # ~1/7.5 of the body is head+neck
        z_neck = z_top - body.dimensions.z * 0.135

    vg = body.vertex_groups.new(name=HEAD_VG)
    span = max(1e-6, z_top - z_neck)
    weights = {}
    painted = 0
    for v in skin:
        t = (v.co.z - z_neck) / span
        w = _smoothstep(0.0, 0.32, t)
        if w > 0.005:
            vg.add([v.index], w, "REPLACE")
            weights[v.index] = w
            painted += 1

    # Pull the face towards the ellipsoid that encloses the skull. Smoothing
    # alone only softens the eyes/nose/lips; projecting onto the head's own
    # bounding ovoid is what actually removes them, and because the pull is
    # scaled by the same feathered weight the jaw and neck stay attached.
    _ovoid_head(mesh, weights, strength=0.93)

    # Two passes: a plain smooth actually dissolves the eyes/lips/brow (it just
    # shrinks the skull while doing it), then a volume-preserving Laplacian pass
    # blows the head back out into a clean ovoid.
    melt = body.modifiers.new("JCV_HeadMelt", "SMOOTH")
    melt.vertex_group = HEAD_VG
    melt.factor = 0.85
    melt.iterations = max(1, iterations)

    infl = body.modifiers.new("JCV_HeadAbstract", "LAPLACIANSMOOTH")
    infl.vertex_group = HEAD_VG
    infl.iterations = max(1, iterations // 2)
    infl.lambda_factor = 2.0
    infl.lambda_border = 0.0
    infl.use_volume_preserve = True
    infl.use_normalized = True

    _select_only(body)
    for i, mod in enumerate((melt, infl)):
        bpy.ops.object.modifier_move_to_index(modifier=mod.name, index=i)
    for mod in (melt, infl):
        bpy.ops.object.modifier_apply(modifier=mod.name)
    body.vertex_groups.remove(body.vertex_groups[HEAD_VG])
    log(f"head abstracted: {painted} verts, {iterations} smoothing iterations")


# ----------------------------------------------------------------- shorts
def build_shorts(body, rig, hem=0.58, rise=0.105):
    """Model fitted shorts out of the body's own surface.

    The hip/thigh band of the skin is duplicated into its own object, pushed a
    hair outwards and thickened, so the garment follows the anatomy exactly and
    can never intersect it. Because the copy keeps the body's vertex groups, the
    same armature deforms both.
    """
    h = body.dimensions.z
    b = rig.data.bones
    try:
        hip_z = (rig.matrix_world @ b["upperleg01.L"].head_local).z
        knee_z = (rig.matrix_world @ b["lowerleg01.L"].head_local).z
    except KeyError:
        log("WARNING: leg bones missing, skipping shorts")
        return None
    z_top = hip_z + rise * h
    z_bot = hip_z + hem * (knee_z - hip_z)
    band_z = z_top - 0.028 * h            # waistband

    shorts = body.copy()
    shorts.data = body.data.copy()
    shorts.name = "JCV_Shorts"
    shorts.data.name = "JCV_ShortsMesh"
    bpy.context.collection.objects.link(shorts)
    shorts.modifiers.clear()
    shorts.parent = body.parent
    shorts.matrix_parent_inverse = body.matrix_parent_inverse.copy()
    # slots must exist before the bmesh pass, otherwise Blender clamps every
    # face back to material_index 0 and the waistband silently disappears
    build_shorts_material(shorts)

    body_gi = shorts.vertex_groups["body"].index

    # The MakeHuman rest pose is an A-pose, so the hands hang *inside* the
    # hip/thigh height band. Cutting on z alone would drag them into the
    # garment; requiring proximity to the pelvis/thigh bones keeps only the
    # geometry the shorts actually wrap.
    core = [(rig.matrix_world @ b.head_local, rig.matrix_world @ b.tail_local)
            for b in rig.data.bones
            if b.name in ("pelvis", "spine04", "spine05",
                          "upperleg01.L", "upperleg02.L",
                          "upperleg01.R", "upperleg02.R")]
    reach = 0.17 * h
    if not core:                       # no named bones: fall back to a midline test
        core = [(Vector((0, 0, z_bot)), Vector((0, 0, z_top)))]
        reach = 0.22 * h

    bm = bmesh.new()
    bm.from_mesh(shorts.data)
    dl = bm.verts.layers.deform.active
    doomed = []
    for v in bm.verts:
        is_skin = dl is not None and v[dl].get(body_gi, 0.0) > 0.5
        near = any(_seg_project(v.co, a, b)[1] <= reach for a, b in core)
        if not (is_skin and near and z_bot <= v.co.z <= z_top):
            doomed.append(v)
    bmesh.ops.delete(bm, geom=doomed, context="VERTS")
    if not bm.faces:
        bm.free()
        log("WARNING: shorts band empty, skipping")
        bpy.data.objects.remove(shorts, do_unlink=True)
        return None
    n_band = 0
    for f in bm.faces:
        centre_z = sum(v.co.z for v in f.verts) / len(f.verts)
        f.material_index = 1 if centre_z >= band_z else 0
        n_band += f.material_index
        f.smooth = True
    n_faces = len(bm.faces)
    bm.to_mesh(shorts.data)
    bm.free()

    for name in [g.name for g in shorts.vertex_groups
                 if g.name.startswith(VG_PREFIX)]:
        shorts.vertex_groups.remove(shorts.vertex_groups[name])

    # relax the staircase the quad topology leaves along the cut, so the hem
    # reads as a fabric edge and not as a plate boundary
    relax = shorts.modifiers.new("Hem", "SMOOTH")
    relax.factor = 0.75
    relax.iterations = 8
    off = shorts.modifiers.new("Offset", "DISPLACE")
    off.strength = 0.010 * h
    off.mid_level = 0.0
    thick = shorts.modifiers.new("Fabric", "SOLIDIFY")
    thick.thickness = 0.011 * h
    thick.offset = 1.0
    thick.use_rim = True
    thick.material_offset_rim = 0
    bevel = shorts.modifiers.new("Soften", "BEVEL")
    bevel.width = 0.004 * h
    bevel.segments = 2
    bevel.limit_method = "ANGLE"
    bevel.angle_limit = math.radians(40)
    arm = shorts.modifiers.new("Armature", "ARMATURE")
    arm.object = rig

    log(f"shorts: {n_faces} faces ({n_band} waistband), "
        f"z {z_bot:.3f}..{z_top:.3f}")
    return shorts


def build_shorts_material(shorts):
    fabric = bpy.data.materials.new("JCV_Shorts_Fabric")
    fabric.use_nodes = True
    b = fabric.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*GRAPHITE, 1)
    b.inputs["Roughness"].default_value = 0.78
    if "Sheen Weight" in b.inputs:
        b.inputs["Sheen Weight"].default_value = 0.35
        b.inputs["Sheen Roughness"].default_value = 0.45
    if "Specular IOR Level" in b.inputs:
        b.inputs["Specular IOR Level"].default_value = 0.22

    band = bpy.data.materials.new("JCV_Shorts_Band")
    band.use_nodes = True
    b = band.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.006, 0.030, 0.036, 1)
    b.inputs["Roughness"].default_value = 0.42
    b.inputs["Emission Color"].default_value = (*BRAND_CYAN, 1)
    b.inputs["Emission Strength"].default_value = 0.42

    shorts.data.materials.clear()
    shorts.data.materials.append(fabric)
    shorts.data.materials.append(band)


# ------------------------------------------------------------ muscle masks
def _group_centroid(obj, group_name):
    gi = obj.vertex_groups.get(group_name)
    if gi is None:
        return None
    idx = gi.index
    acc, n = Vector((0, 0, 0)), 0
    for v in obj.data.vertices:
        for g in v.groups:
            if g.group == idx and g.weight > 0.2:
                acc += v.co
                n += 1
                break
    return acc / n if n else None


def detect_front_axis(body):
    """Return the unit vector pointing out of the mannequin's face."""
    lips = _group_centroid(body, "lips")
    scalp = _group_centroid(body, "scalp")
    if lips is None or scalp is None:
        return Vector((0, -1, 0))
    d = lips - scalp
    return Vector((0, -1, 0)) if d.y < 0 else Vector((0, 1, 0))


def _seg_project(p, a, b):
    ab = b - a
    denom = ab.length_squared
    if denom < 1e-12:
        return 0.0, (p - a).length
    t = max(0.0, min(1.0, (p - a).dot(ab) / denom))
    return t, (p - (a + ab * t)).length


def _smooth(values, edges, iterations=3, keep=0.45):
    n = len(values)
    nbrs = [[] for _ in range(n)]
    for e in edges:
        a, b = e.vertices
        nbrs[a].append(b)
        nbrs[b].append(a)
    cur = values
    for _ in range(iterations):
        nxt = [0.0] * n
        for i in range(n):
            if nbrs[i]:
                avg = sum(cur[j] for j in nbrs[i]) / len(nbrs[i])
            else:
                avg = cur[i]
            nxt[i] = keep * cur[i] + (1.0 - keep) * avg
        cur = nxt
    return cur


def bake_muscle_groups(body, rig):
    """Create one JCV_<muscle> vertex group per muscle region."""
    mesh = body.data
    height = body.dimensions.z
    front = detect_front_axis(body)
    back = -front
    up = Vector((0, 0, 1))
    lateral = front.cross(up).normalized()

    m_world = body.matrix_world
    a_world = rig.matrix_world

    # body group -> only paint the visible skin, never helper geometry
    body_gi = body.vertex_groups.get("body")
    body_idx = body_gi.index if body_gi else None

    def is_body(v):
        if body_idx is None:
            return True
        return any(g.group == body_idx and g.weight > 0.5 for g in v.groups)

    coords = [m_world @ v.co for v in mesh.vertices]
    normals = [(m_world.to_3x3() @ v.normal).normalized() for v in mesh.vertices]
    body_flags = [is_body(v) for v in mesh.vertices]

    bones = {b.name: (a_world @ b.head_local, a_world @ b.tail_local)
             for b in rig.data.bones}

    dir_map = {"front": front, "back": back, "up": up, "down": -up}

    for name, spec in MUSCLES.items():
        segs = [bones[b] for b in spec["bones"] if b in bones]
        if not segs:
            log(f"WARNING: no bones resolved for {name}")
            continue
        radius = spec["radius"] * height
        tmin, tmax = spec["t"]
        want_dir = dir_map.get(spec["dir"])
        min_dot = spec["dot"]
        min_side = spec.get("side_dot")

        raw = [0.0] * len(mesh.vertices)
        for i, p in enumerate(coords):
            if not body_flags[i]:
                continue
            best = None
            for a, b in segs:
                t, d = _seg_project(p, a, b)
                if best is None or d < best[1]:
                    best = (t, d)
            t, d = best
            if d > radius or not (tmin <= t <= tmax):
                continue
            w = 1.0 - (d / radius) ** 2
            if want_dir is not None:
                nd = normals[i].dot(want_dir)
                if nd < min_dot:
                    continue
                w *= min(1.0, (nd - min_dot) / max(1e-3, 0.55 - min_dot))
            if min_side is not None:
                sd = abs(normals[i].dot(lateral))
                if sd < min_side:
                    continue
                w *= min(1.0, (sd - min_side) / max(1e-3, 0.75 - min_side))
            # lateral falloff for symmetric limb muscles is implicit (per-bone)
            raw[i] = max(raw[i], max(0.0, min(1.0, w)))

        smooth = _smooth(raw, mesh.edges, iterations=4)
        # renormalise so the region still peaks at 1.0 after blurring
        peak = max(smooth) or 1.0
        vg = body.vertex_groups.new(name=VG_PREFIX + name)
        painted = 0
        for i, w in enumerate(smooth):
            w = w / peak
            if w > 0.02:
                vg.add([i], min(1.0, w), "REPLACE")
                painted += 1
        log(f"muscle {name:<11} -> {painted} verts")


# ----------------------------------------------------------------- shading
def build_body_material(body):
    mat = bpy.data.materials.new("JCV_Mannequin")
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (900, 0)

    # matte grey skin
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (300, 200)
    bsdf.inputs["Base Color"].default_value = (0.055, 0.058, 0.066, 1)
    bsdf.inputs["Roughness"].default_value = 0.46
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.38
    # a little skin translucency + a fabric-like sheen keeps the silhouette from
    # reading as flat grey plastic
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = 0.16
        bsdf.inputs["Subsurface Radius"].default_value = (0.09, 0.045, 0.032)
        bsdf.inputs["Subsurface Scale"].default_value = 0.035
    if "Subsurface Color" in bsdf.inputs:
        bsdf.inputs["Subsurface Color"].default_value = (0.22, 0.10, 0.09, 1)
    if "Sheen Weight" in bsdf.inputs:
        bsdf.inputs["Sheen Weight"].default_value = 0.22
        bsdf.inputs["Sheen Roughness"].default_value = 0.35
        bsdf.inputs["Sheen Tint"].default_value = (0.62, 0.76, 1.0, 1)

    # glowing muscle: a shaded cyan surface that also emits, so the muscle keeps
    # its 3D form instead of blowing out into a flat white blob
    emit = nt.nodes.new("ShaderNodeBsdfPrincipled")
    emit.location = (300, -320)
    emit.inputs["Base Color"].default_value = (0.02, 0.16, 0.19, 1)
    emit.inputs["Roughness"].default_value = 0.42
    emit.inputs["Emission Color"].default_value = (*BRAND_CYAN, 1)
    emit.inputs["Emission Strength"].default_value = 1.35

    # the per-vertex mask written by render_exercise.py
    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.location = (-200, -20)
    attr.attribute_name = "muscle_mask"
    attr.attribute_type = "GEOMETRY"

    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.location = (20, -20)
    ramp.color_ramp.interpolation = "B_SPLINE"
    ramp.color_ramp.elements[0].position = 0.10
    ramp.color_ramp.elements[1].position = 0.55

    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.location = (620, 0)

    nt.links.new(attr.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], mix.inputs["Fac"])
    nt.links.new(bsdf.outputs["BSDF"], mix.inputs[1])
    nt.links.new(emit.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])

    body.data.materials.clear()
    body.data.materials.append(mat)

    for poly in body.data.polygons:
        poly.use_smooth = True
    return mat


def build_world():
    world = bpy.data.worlds.new("JCV_World")
    bpy.context.scene.world = world
    world.use_nodes = True
    bg = world.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (*BG_COLOR, 1)
    bg.inputs[1].default_value = 1.0


def _area_light(name, loc, rot, energy, size, color=(1, 1, 1)):
    data = bpy.data.lights.new(name, type="AREA")
    data.energy = energy
    data.size = size
    data.color = color
    obj = bpy.data.objects.new(name, data)
    obj.location = loc
    obj.rotation_euler = rot
    bpy.context.collection.objects.link(obj)
    return obj


def build_lighting(body):
    """Three-point studio rig, scaled to the body, parented to an empty so the
    whole lighting setup follows the mannequin."""
    h = body.dimensions.z
    cz = h * 0.55
    r = h * 1.4

    # key: high, camera-left front
    _area_light("KEY", (-r * 0.75, -r * 0.8, h * 1.55),
                (math.radians(52), 0, math.radians(-42)),
                energy=110 * (h ** 2), size=h * 0.9, color=(1.0, 0.97, 0.93))
    # cool rim left
    _area_light("RIM_L", (-r * 1.05, r * 0.65, cz + h * 0.3),
                (math.radians(78), 0, math.radians(-145)),
                energy=200 * (h ** 2), size=h * 0.5, color=(0.70, 0.84, 1.0))
    # cool rim right
    _area_light("RIM_R", (r * 1.05, r * 0.65, cz + h * 0.3),
                (math.radians(78), 0, math.radians(145)),
                energy=200 * (h ** 2), size=h * 0.5, color=(0.70, 0.84, 1.0))
    # low fill so the front never goes fully black
    _area_light("FILL", (r * 0.55, -r * 1.0, cz * 0.7),
                (math.radians(85), 0, math.radians(28)),
                energy=28 * (h ** 2), size=h * 1.2, color=(0.88, 0.93, 1.0))


def build_floor(body):
    """Dark studio ground so the figure sits on something instead of floating.

    Nearly black and fairly glossy: it never reads as a lit floor, it only picks
    up the contact shadow under the feet and a faint smear of the cyan glow.
    """
    h = body.dimensions.z
    bpy.ops.mesh.primitive_plane_add(size=h * 14, location=(0, 0, -0.0015))
    floor = bpy.context.object
    floor.name = "JCV_Floor"
    mat = bpy.data.materials.new("JCV_Floor")
    mat.use_nodes = True
    nt = mat.node_tree
    b = nt.nodes["Principled BSDF"]
    # Matte, not glossy: a shiny floor mirrors the studio area lights into a
    # blown-out white blob at the bottom of a 9:16 frame.
    b.inputs["Base Color"].default_value = (0.0062, 0.0068, 0.0080, 1)
    b.inputs["Roughness"].default_value = 0.80
    b.inputs["Metallic"].default_value = 0.0
    if "Specular IOR Level" in b.inputs:
        b.inputs["Specular IOR Level"].default_value = 0.10

    # Fade the plane into the void away from the figure. Without this the glossy
    # floor mirrors the studio lights into a big white wash at the bottom of a
    # 9:16 frame; with it, all that survives is a small pool of reflection and
    # the contact shadow right under the feet.
    out = nt.nodes["Material Output"]
    coord = nt.nodes.new("ShaderNodeTexCoord")
    coord.location = (-900, 0)
    grad = nt.nodes.new("ShaderNodeTexGradient")
    grad.gradient_type = "SPHERICAL"
    grad.location = (-700, 0)
    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.location = (-780, 0)
    mapping.inputs["Scale"].default_value = (1 / (h * 1.15),) * 3
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.location = (-520, 0)
    ramp.color_ramp.interpolation = "B_SPLINE"
    # Blender's spherical gradient is 1 at the origin and 0 at the edge, and the
    # mix factor picks input[2] (transparent) at 1 -- so the ramp has to run
    # WHITE (far, transparent) -> BLACK (under the figure, opaque).
    ramp.color_ramp.elements[0].position = 0.30
    ramp.color_ramp.elements[0].color = (1, 1, 1, 1)
    ramp.color_ramp.elements[1].position = 0.80
    ramp.color_ramp.elements[1].color = (0, 0, 0, 1)
    transp = nt.nodes.new("ShaderNodeBsdfTransparent")
    transp.location = (0, -260)
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.location = (420, 0)

    nt.links.new(coord.outputs["Object"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], grad.inputs["Vector"])
    nt.links.new(grad.outputs["Fac"], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], mix.inputs["Fac"])
    nt.links.new(b.outputs["BSDF"], mix.inputs[1])
    nt.links.new(transp.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    floor.data.materials.append(mat)
    return floor


def configure_render():
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    sc.render.resolution_x = 1080
    sc.render.resolution_y = 1920
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = "PNG"
    sc.eevee.taa_render_samples = 48
    sc.eevee.use_raytracing = True
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Punchy"


def main():
    args = parse_args(sys.argv)
    wipe_scene()
    enable_mpfb()
    body = create_body(args)
    if args.abstract_head:
        abstract_head(body, iterations=args.head_smooth)
    rig = add_rig(body)
    if args.shorts:
        build_shorts(body, rig)
    bake_muscle_groups(body, rig)
    build_body_material(body)
    build_world()
    build_lighting(body)
    if args.floor:
        build_floor(body)
    configure_render()

    out = os.path.abspath(args.out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=out)
    log(f"saved {out}")
    log("muscles: " + ", ".join(MUSCLE_NAMES))


if __name__ == "__main__":
    main()
