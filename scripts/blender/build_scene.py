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
# Muscle definitions — CANONICAL REGION VOCABULARY.
#
# Region names are the SAME ids the 2D SVG atlas uses
# (src/shared/components/MuscleAtlas/atlas-data.ts, AtlasRegionId), so one
# exercise definition drives the 2D atlas and the 3D glow identically. The
# dataset->region translation lives in scripts/blender/muscle_map.json and
# must agree with the atlas's muscle-map.ts (same approximations:
# abductors->glutes, middle back/rhomboids->lats, ...).
#
# Every region is a LIST OF PARTS combined by max. Each part is defined
# RELATIVE TO THE RIG (bone segments + surface normal direction), never in
# absolute world coordinates, so it survives a change of body proportions.
#
#   bones : rest bones whose segment "owns" this part
#   t     : (min, max) normalised position along the bone segment
#   dir   : required surface direction, in body-space:
#             front / back / up / down     fixed body axes
#             out / in                     lateral, away from / towards the
#                                          midline (per-vertex sign, so one
#                                          spec covers both body halves)
#             back_up                      blend for the trap slope
#             any                          no direction test
#   dot   : minimum dot product between vertex normal and that direction
#   side_dot : optional, minimum |normal . lateral| so a part can be limited
#              to the sides of the body (used to carve the lats off the spine)
#   max_side : optional, MAXIMUM |normal . lateral| — keeps a part on the
#              front/back column (abs, lower back) instead of wrapping the
#              flanks
#   avoid : optional (dir_name, max_dot) or list of them — reject a vertex
#           whose normal agrees with that direction more than max_dot (quads
#           use it to stay off the inner thigh, obliques off the back,
#           pectorals off the shoulder tops and armpits)
#   radius: max distance to the bone segment, as a multiple of body height
# --------------------------------------------------------------------------
MUSCLES = {
    # ---- torso, front
    "pectorals": [
        dict(bones=["breast.L", "breast.R"],
             t=(0.0, 1.0), dir="front", dot=0.35, radius=0.070,
             avoid=[("up", 0.72), ("out", 0.60)]),
    ],
    # NB: the MakeHuman spine is numbered top-down, spine05 sits at the pelvis
    "abs": [
        dict(bones=["spine03", "spine04"],
             t=(0.0, 1.0), dir="front", dot=0.25, radius=0.105,
             max_side=0.50),
        # only the very top of spine05: keeps the column above the shorts so
        # the glow does not pool on the garment below the navel
        dict(bones=["spine05"],
             t=(0.70, 1.0), dir="front", dot=0.25, radius=0.105,
             max_side=0.50),
    ],
    "obliques": [
        dict(bones=["spine03", "spine04", "spine05"],
             t=(0.0, 1.0), dir="out", dot=0.45, radius=0.100,
             avoid=("back", 0.35)),
    ],
    # ---- torso, back
    "lats": [
        # top of the wing reaches the armpit (outer upper back only: the
        # inner column at that height belongs to the traps)
        dict(bones=["spine01"],
             t=(0.0, 0.35), dir="back", dot=0.05, radius=0.115,
             side_dot=0.35),
        dict(bones=["spine02"],
             t=(0.0, 0.95), dir="back", dot=0.05, radius=0.120,
             side_dot=0.18),
        dict(bones=["spine03"],
             t=(0.0, 1.0), dir="back", dot=0.05, radius=0.095,
             side_dot=0.30),
    ],
    "traps": [
        dict(bones=["spine01"],
             t=(0.0, 1.0), dir="back", dot=0.25, radius=0.055,
             max_side=0.50),
        dict(bones=["spine02"],
             t=(0.5, 1.0), dir="back", dot=0.25, radius=0.050,
             max_side=0.40),
        dict(bones=["neck01", "neck02"],
             t=(0.0, 1.0), dir="back", dot=0.10, radius=0.035),
        dict(bones=["shoulder01.L", "shoulder01.R"],
             t=(0.0, 0.50), dir="back_up", dot=0.35, radius=0.045),
    ],
    "lower-back": [
        dict(bones=["spine04", "spine05"],
             t=(0.0, 1.0), dir="back", dot=0.25, radius=0.070,
             max_side=0.40),
    ],
    # ---- arms
    "delts": [
        dict(bones=["shoulder01.L", "shoulder01.R"],
             t=(0.70, 1.0), dir="any", dot=0.0, radius=0.040),
        dict(bones=["upperarm01.L", "upperarm01.R"],
             t=(0.0, 0.55), dir="any", dot=0.0, radius=0.048),
    ],
    # biceps/triceps live on upperarm02 ONLY: spanning upperarm01 as well let
    # the biceps bleed up into the deltoid cap
    "biceps": [
        dict(bones=["upperarm02.L", "upperarm02.R"],
             t=(0.05, 0.92), dir="front", dot=0.25, radius=0.042),
    ],
    "triceps": [
        dict(bones=["upperarm02.L", "upperarm02.R"],
             t=(0.08, 0.95), dir="back", dot=0.25, radius=0.042),
    ],
    "forearms": [
        dict(bones=["lowerarm01.L", "lowerarm01.R",
                    "lowerarm02.L", "lowerarm02.R"],
             t=(0.05, 0.85), dir="any", dot=0.0, radius=0.042),
    ],
    # ---- hips + legs
    # glutes: upperleg01 head sits at the iliac crest, so the old
    # t=(0.0, 0.22) band floated ABOVE the actual glute mass; the region now
    # runs down the whole of upperleg01 and into the top of upperleg02
    "glutes": [
        dict(bones=["upperleg01.L", "upperleg01.R"],
             t=(0.15, 1.0), dir="back", dot=0.10, radius=0.088),
        dict(bones=["upperleg02.L", "upperleg02.R"],
             t=(0.0, 0.10), dir="back", dot=0.10, radius=0.082),
    ],
    "adductors": [
        dict(bones=["upperleg02.L", "upperleg02.R"],
             t=(0.0, 0.65), dir="in", dot=0.30, radius=0.090),
    ],
    "quads": [
        dict(bones=["upperleg01.L", "upperleg02.L",
                    "upperleg01.R", "upperleg02.R"],
             t=(0.10, 1.0), dir="front", dot=0.05, radius=0.10,
             avoid=("in", 0.55)),
    ],
    "hamstrings": [
        dict(bones=["upperleg02.L", "upperleg02.R"],
             t=(0.06, 0.95), dir="back", dot=0.10, radius=0.095),
    ],
    "calves": [
        dict(bones=["lowerleg01.L", "lowerleg02.L",
                    "lowerleg01.R", "lowerleg02.R"],
             t=(0.0, 0.75), dir="back", dot=0.05, radius=0.075),
    ],
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
    p.add_argument("--hdri", default="auto",
                   help="studio HDRI lighting the scene (packed into the "
                        ".blend). 'auto' picks the first .hdr in "
                        "assets/3d/hdri/, 'none' keeps pure area lighting")
    p.add_argument("--hdri-strength", type=float, default=0.30,
                   help="world strength of the HDRI; low keeps the void dark "
                        "(0.55 halos the whole figure through the bloom pass)")
    p.add_argument("--hdri-rotation", type=float, default=205.0,
                   help="Z rotation of the HDRI in degrees; aims the softbox")
    # OFF by default: the reference mannequins (fitonomy / holix / gym.advice)
    # keep real hands — they grip bars and handles, so fingers read as correct.
    # Melting them produced amputated-looking stumps, a clear regression. Only
    # the FACE is abstracted. Kept behind a flag in case a future look needs it.
    p.add_argument("--stylise-extremities", dest="extremities",
                   action="store_true",
                   help="melt fingers/toes into simplified masses (regression: "
                        "reads as amputation — see README)")
    p.add_argument("--toe-stub", type=float, default=0.52,
                   help="toe length past the ball of the foot")
    p.add_argument("--extremity-smooth", type=int, default=14,
                   help="relax iterations over the hands and feet")
    p.set_defaults(shorts=True, abstract_head=True, floor=True,
                   extremities=False)
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


# ----------------------------------------------------- stylised extremities
#
# MakeHuman ships anatomically literal hands and feet -- five separated toes
# with toenails, five separated fingers. Next to a stylised body with a
# featureless head that is the single loudest "generic 3D render" tell, so the
# extremities are melted into simplified masses.
#
# Hands and feet need DIFFERENT treatments, which is the main thing to know
# before touching any of this.
#
# Feet get a SWEPT HULL. Pick an axis through the limb (heel -> toe tip), cut
# the region into slices along it, describe each slice as a superellipse fitted
# to that slice's own outline, blur those along the sweep, and push every vertex
# onto the result. The gaps between the toes are interior to the profile so they
# fill in, while the profile is measured from the real anatomy and keeps the
# limb's true proportions -- `_ovoid_head()`'s trick generalised from one
# ellipsoid to a swept one. Toes are short, so this is enough.
#
# Hands cannot be done that way. Fingers are half the length of the hand: a hull
# that spans them has to bridge gaps as long as the geometry itself, and whether
# you push the webbing outwards (shells cross, cracks) or collapse it inwards
# (open notches) the result is a mess. So fingers 2..5 are AMPUTATED at the
# knuckles and the opening is domed shut; the swept hull then only has to tidy
# up the palm. The thumb is left untouched -- it is what keeps the silhouette
# reading as a hand rather than a paddle.
# --------------------------------------------------------------------------
HAND_VG = "JCV_HandMask"
STUMP_VG = "JCV_Stump"


def _finger_bones(side, thumb=True):
    lo = 1 if thumb else 2
    names = [f"wrist.{side}"]
    names += [f"metacarpal{i}.{side}" for i in range(lo, 5)]
    names += [f"finger{f}-{s}.{side}" for f in range(lo, 6) for s in range(1, 4)]
    return names


def _bone_segments(rig, names):
    out = []
    for n in names:
        b = rig.data.bones.get(n)
        if b is not None:
            out.append((rig.matrix_world @ b.head_local,
                        rig.matrix_world @ b.tail_local))
    return out


def _blur(seq, passes=3):
    """Box-blur a per-slice series (open ends). Without it, every quad row of
    the source topology leaves a visible ring in the hull."""
    n = len(seq)
    for _ in range(passes):
        seq = [(seq[max(0, s - 1)] + seq[s] + seq[min(n - 1, s + 1)]) / 3.0
               for s in range(n)]
    return seq


def _sweep_hull(mesh, weights, origin, u_dir, v_dir, w_dir,
                stub_from=None, stub=1.0, exponent=2.6, swell=1.0,
                bury=1.0, n_slices=20):
    """Project the weighted vertices onto a swept superellipse fitted to their
    own outline.

    Each slice along `u_dir` is described by just a centre and two half-widths
    (V across `v_dir`, W across `w_dir`), blurred along the sweep. A vertex is
    then pushed radially onto the superellipse

        |dv / V| ** n + |dw / W| ** n = 1

    An earlier version sampled a max-radius-per-angular-bin polar profile
    instead. It has more expressive power and it is wrong: near the fingertips
    the slice centroid can fall outside the cross-section, the profile becomes
    double-valued in theta, and the projection tears the mesh open. Two numbers
    per slice cannot do that. `exponent` controls how boxy the cross-section is
    -- 2.0 is a plain ellipse, ~2.6 keeps the sole of the foot flat enough to
    stand on.
    """
    idxs = list(weights)
    if len(idxs) < 64:
        log("WARNING: extremity region too small, skipping")
        return 0

    local = {}
    for i in idxs:
        d = mesh.vertices[i].co - origin
        u = d.dot(u_dir)
        if stub_from is not None and u > stub_from:
            u = stub_from + (u - stub_from) * stub
        local[i] = (u, d.dot(v_dir), d.dot(w_dir))

    us = [c[0] for c in local.values()]
    u0, u1 = min(us), max(us)
    span = max(u1 - u0, 1e-6)

    def slice_of(u):
        return max(0, min(n_slices - 1, int((u - u0) / span * (n_slices - 1))))

    # Clamp the sweep where the limb stops being solid. The last few slices of a
    # hand contain only the middle fingertip, so the hull there is a needle;
    # interior vertices collapsed towards the axis then hang out past the end of
    # the mitten as thin blades. Squashing everything past the last well
    # populated slice keeps the tips inside the form.
    pop = [0] * n_slices
    for u, _v, _w in local.values():
        pop[slice_of(u)] += 1
    busy = max(pop) or 1
    s_end = max((s for s, p in enumerate(pop) if p >= busy * 0.22),
                default=n_slices - 1)
    if s_end < n_slices - 1:
        u_end = u0 + span * (s_end / (n_slices - 1))
        for i, (u, v, w) in local.items():
            if u > u_end:
                u = u_end + (u - u_end) * 0.18
            local[i] = (u, v, w)
        us = [c[0] for c in local.values()]
        u0, u1 = min(us), max(us)
        span = max(u1 - u0, 1e-6)

    acc = [[0.0, 0.0, 0] for _ in range(n_slices)]
    for u, v, w in local.values():
        s = slice_of(u)
        acc[s][0] += v
        acc[s][1] += w
        acc[s][2] += 1
    cv, cw = [], []
    lv, lw = 0.0, 0.0
    for a in acc:
        if a[2]:
            lv, lw = a[0] / a[2], a[1] / a[2]
        cv.append(lv)
        cw.append(lw)
    cv, cw = _blur(cv, 2), _blur(cw, 2)

    hv = [1e-9] * n_slices
    hw = [1e-9] * n_slices
    for u, v, w in local.values():
        s = slice_of(u)
        hv[s] = max(hv[s], abs(v - cv[s]))
        hw[s] = max(hw[s], abs(w - cw[s]))
    # a slice with no samples would collapse the hull to a point there
    for arr in (hv, hw):
        for s in range(1, n_slices):
            if arr[s] <= 1e-8:
                arr[s] = arr[s - 1]
    hv, hw = _blur(hv), _blur(hw)

    def profile(u):
        f = (u - u0) / span * (n_slices - 1)
        s0 = max(0, min(n_slices - 1, int(f)))
        s1 = min(n_slices - 1, s0 + 1)
        t = f - s0
        mix = lambda a: a[s0] * (1 - t) + a[s1] * t   # noqa: E731
        return mix(cv), mix(cw), max(mix(hv), 1e-6), max(mix(hw), 1e-6)

    n = max(1.2, exponent)
    moved = 0
    for i, wgt in weights.items():
        u, v, w = local[i]
        c_v, c_w, half_v, half_w = profile(u)
        dv, dw = v - c_v, w - c_w
        norm = (abs(dv / half_v) ** n + abs(dw / half_w) ** n) ** (1.0 / n)
        if norm < 1e-9:
            tv, tw = c_v, c_w
        else:
            # `bury` decides what happens to geometry that sits *inside* the
            # hull -- the webbing, and the facing sides of two adjacent digits.
            #
            #   bury = 1.0  push it out onto the hull like everything else. The
            #               two walls of a gap land on the same surface and the
            #               weld pass fuses them into one skin. Right for hands,
            #               where the gaps are long and burying them would leave
            #               open notches between the fingers.
            #   bury < 1.0  collapse it towards the sweep axis instead, so it
            #               ends up sealed inside the closed surface. Right for
            #               toes, which are short enough that the ball of the
            #               foot already spans the gap.
            if bury >= 0.999:
                k = swell / norm
            else:
                b = _smoothstep(0.55, 0.85, norm)
                k = bury * (1.0 - b) + (swell / norm) * b
            tv, tw = c_v + dv * k, c_w + dw * k
        target = origin + u_dir * u + v_dir * tv + w_dir * tw
        mesh.vertices[i].co = mesh.vertices[i].co.lerp(target, wgt)
        moved += 1
    return moved


def _amputate_fingers(body, rig, cut_bone="finger{f}-1.{side}"):
    """Cut fingers 2..5 off at the knuckles and cap the stumps.

    Squashing the fingers down into the palm instead was tried first and it
    cannot work: five telescoped shells end up interpenetrating in a few
    millimetres, and the hull projection turns that tangle into a faceted mess
    at the end of the hand. There is no way to smooth your way out of it, so the
    geometry is simply removed and the openings are filled. The thumb is left
    alone -- it is what keeps the shape reading as a hand rather than a paddle.
    """
    mesh = body.data
    # JointCubes are deliberately NOT skipped here. MakeHuman parks a little
    # cube inside every joint for the rig fitter; the "Hide helpers" mask only
    # covers HelperGeometry, so the cubes render -- they are simply buried inside
    # the limb. Remove the fingers and the knuckle cubes are suddenly exposed as
    # flat plates floating off the hand. The rig has already been generated by
    # this point, so they are safe to delete.
    skip = _verts_in_groups(body, ("HelperGeometry",))
    mw = body.matrix_world
    kill = set()
    zone = []
    for side in ("L", "R"):
        names = [f"finger{f}-{s}.{side}"
                 for f in range(2, 6) for s in range(1, 4)]
        segs = _bone_segments(rig, names)
        if not segs:
            continue
        cuts = _bone_segments(rig, [cut_bone.format(f=f, side=side)
                                    for f in range(2, 6)])
        if not cuts:
            continue
        # the knuckle line, and how far a finger vertex may sit from its bone
        reach = max((a - b).length for a, b in segs) * 1.4
        # The thumb has to be protected explicitly. It sits well inside `reach`
        # of the index metacarpal, and cutting into it leaves torn shards
        # hanging off the hand rather than a clean stump.
        # ...but only the thumb *proper*. Protecting the whole thumb ray,
        # metacarpal included, keeps the web between thumb and index: once the
        # index finger is gone that membrane has nothing to span and hangs off
        # the hand as a flat sheet.
        thumb = _bone_segments(rig, [f"finger1-{s}.{side}" for s in range(1, 4)])
        thumb_reach = max((a - b).length for a, b in thumb) * 0.85 if thumb else 0
        palm = sum((a for a, _ in cuts), Vector()) / len(cuts)
        tip = sum((b for _, b in segs), Vector()) / len(segs)
        out = (tip - palm).normalized()
        zone.append((palm, reach * 2.4))
        for v in mesh.vertices:
            if v.index in skip:
                continue
            p = mw @ v.co
            if (p - palm).dot(out) <= 0.0:
                continue
            d = min(_seg_project(p, a, b)[1] for a, b in segs)
            if d > reach:
                continue
            if thumb and min(_seg_project(p, a, b)[1]
                             for a, b in thumb) <= thumb_reach:
                continue
            kill.add(v.index)
    if not kill:
        log("WARNING: no finger geometry found to amputate")
        return

    # Tag the stump so the relax pass downstream can find it. The cap vertices
    # are created here, after which every index in the mesh shifts, so a vertex
    # group carried through the bmesh deform layer is the only stable handle.
    stump_gi = body.vertex_groups.new(name=STUMP_VG).index

    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.verts.ensure_lookup_table()
    doomed = [v for v in bm.verts if v.index in kill]
    bmesh.ops.delete(bm, geom=doomed, context="VERTS")
    # Fill only the boundaries we just opened. The body mesh has other legitimate
    # open borders (mouth bag, eye sockets) and holes_fill over all of them would
    # weld the face shut.
    inv = body.matrix_world.inverted()
    local_zone = [(inv @ p, r) for p, r in zone]
    # Skin only. MakeHuman's helper meshes (tights, skirt, hair, eye bags) live
    # in the same mesh datablock and, because the rest pose is an A-pose, the
    # hip helper geometry hangs right where the hands do. Collapsing one of its
    # boundary loops staples a flat sheet across the knuckles.
    dl0 = bm.verts.layers.deform.active
    skin_gi = body.vertex_groups["body"].index if "body" in body.vertex_groups \
        else None

    def is_skin(v):
        if dl0 is None or skin_gi is None:
            return True
        return v[dl0].get(skin_gi, 0.0) > 0.5

    edges = [e for e in bm.edges if e.is_boundary
             and all(is_skin(v) for v in e.verts)
             and any((v.co - c).length <= r
                     for v in e.verts for c, r in local_zone)]

    # Close every stump by collapsing its boundary loop onto one point, nudged
    # outwards so it domes rather than dimples. `holes_fill` was the obvious
    # choice and it is worse: it caps each knuckle with an n-gon, and an n-gon
    # pushed onto the swept hull shatters into visible facets.
    loops, seen = [], set()
    adj = {}
    for e in edges:
        for v in e.verts:
            adj.setdefault(v, []).append(e)
    for e in edges:
        if e in seen:
            continue
        loop, stack = [], [e]
        while stack:
            cur = stack.pop()
            if cur in seen:
                continue
            seen.add(cur)
            loop.append(cur)
            for v in cur.verts:
                stack.extend(x for x in adj.get(v, []) if x not in seen)
        loops.append(loop)

    dl = bm.verts.layers.deform.active or bm.verts.layers.deform.verify()
    capped = 0
    for loop in loops:
        verts = {v for e in loop for v in e.verts}
        if len(verts) < 3:
            continue
        centre = sum((v.co for v in verts), Vector()) / len(verts)
        radius = sum((v.co - centre).length for v in verts) / len(verts)
        normal = Vector()
        for v in verts:
            normal += v.normal
        dome = normal.normalized() if normal.length > 1e-6 else Vector((0, 0, 1))
        # paint the loop and its first ring before the merge: every vertex the
        # cap is grown from carries the tag onwards
        for v in list(verts):
            for e in v.link_edges:
                for nb in e.verts:
                    nb[dl][stump_gi] = 1.0

        # Grow the cap inwards in rings rather than collapsing the loop straight
        # onto a point. Deleting four fingers and their webbing leaves ONE
        # opening as wide as the hand, and a single pointmerge turns that into a
        # broad flat cone that reads on camera as a sheet of card stapled across
        # the knuckles. Three shrinking extrusions give a dome instead.
        ring = list(loop)
        for shrink, lift in ((0.72, 0.42), (0.40, 0.30), (0.0, 0.0)):
            if shrink <= 0.0:
                break
            ret = bmesh.ops.extrude_edge_only(bm, edges=ring)
            new_v = [g for g in ret["geom"] if isinstance(g, bmesh.types.BMVert)]
            ring = [g for g in ret["geom"] if isinstance(g, bmesh.types.BMEdge)
                    and all(x in new_v for x in g.verts)]
            for v in new_v:
                v.co = centre + (v.co - centre) * shrink + dome * (lift * radius)
                v[dl][stump_gi] = 1.0
            if not ring:
                break
        tip_verts = {v for e in ring for v in e.verts} or verts
        bmesh.ops.pointmerge(bm, verts=list(tip_verts),
                             merge_co=centre + dome * (radius * 0.55))
        capped += 1

    bmesh.ops.dissolve_degenerate(bm, dist=1e-5, edges=bm.edges)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    log(f"fingers amputated: {len(kill)} verts removed, {capped} stumps capped")


def _region_weights(body, rig, bone_names, origin, u_dir,
                    reach, feather_lo, feather_hi, exclude_bones=()):
    """Feathered weights over the skin around a set of bones.

    `feather_lo/hi` are positions along `u_dir` from `origin`: 0 below lo (the
    limb keeps its anatomy), 1 above hi (fully stylised)."""
    mesh = body.data
    skip = _verts_in_groups(body, ("JointCubes", "HelperGeometry"))
    segs = _bone_segments(rig, bone_names)
    if not segs:
        return {}
    mw = body.matrix_world
    keep_out = _bone_segments(rig, exclude_bones)
    out = {}
    for v in mesh.vertices:
        if v.index in skip:
            continue
        p = mw @ v.co
        d = min((_seg_project(p, a, b)[1] for a, b in segs), default=1e9)
        if d > reach:
            continue
        # a vertex that belongs to an excluded bone (the thumb) must be left
        # entirely alone: projecting only part of it tears it into shards
        if keep_out and min(_seg_project(p, a, b)[1]
                            for a, b in keep_out) < d:
            continue
        u = (v.co - origin).dot(u_dir)
        w = _smoothstep(feather_lo, feather_hi, u)
        if w > 0.004:
            out[v.index] = w
    return out


def stylise_extremities(body, rig, toe_stub=0.52,
                        smooth_iters=14):
    """Melt the hands into mittens and the toes into a single foot form."""
    _amputate_fingers(body, rig)
    mesh = body.data
    h = body.dimensions.z
    total = 0
    touched = {}

    for side in ("L", "R"):
        # ---------------- hand: sweep from the wrist out along the fingers
        wrist = rig.data.bones.get(f"wrist.{side}")
        tips = [rig.data.bones.get(f"finger{f}-3.{side}") for f in range(2, 6)]
        tips = [t for t in tips if t is not None]
        if wrist is None or not tips:
            log(f"WARNING: hand bones missing for {side}, skipping")
            continue
        o = rig.matrix_world @ wrist.head_local
        tip = sum((rig.matrix_world @ t.tail_local for t in tips),
                  Vector()) / len(tips)
        u_dir = (tip - o).normalized()
        hand_len = (tip - o).length
        # `v` must run across the finger fan and `w` through the palm, and the
        # only reliable source for that is the knuckle line: the hand hangs
        # almost straight down in the A-pose, so u_dir x world-up is degenerate
        # and leaves the ellipse rotated at random about the arm.
        index = rig.data.bones.get(f"finger2-1.{side}")
        pinky = rig.data.bones.get(f"finger5-1.{side}")
        if index is not None and pinky is not None:
            fan = (rig.matrix_world @ pinky.head_local) - \
                  (rig.matrix_world @ index.head_local)
            fan -= u_dir * fan.dot(u_dir)          # orthogonalise against u
        else:
            fan = Vector()
        if fan.length < 1e-5:
            fan = u_dir.cross(Vector((0, 0, 1)))
        v_dir = fan.normalized()
        w_dir = u_dir.cross(v_dir).normalized()

        # the thumb is deliberately left out of the hull: rolling it into the
        # swept ellipse turns the whole hand into an anonymous paddle
        weights = _region_weights(body, rig, _finger_bones(side, thumb=False),
                                  o, u_dir,
                                  reach=hand_len * 0.42,
                                  feather_lo=-hand_len * 0.10,
                                  feather_hi=hand_len * 0.30,
                                  exclude_bones=[f"finger1-{s}.{side}"
                                                 for s in range(1, 4)]
                                  + [f"metacarpal1.{side}"])
        n = _sweep_hull(mesh, weights, o, u_dir, v_dir, w_dir,
                        exponent=2.4, bury=1.0, n_slices=22) or 0
        for i, wt in weights.items():
            touched[i] = max(touched.get(i, 0.0), wt)
        # The thumb base is excluded from the hull on purpose, which also left
        # it out of the relax pass -- and it is exactly where the index finger
        # used to attach, so it keeps a hard webbing rim that catches the light
        # as a sliver. Relax it without projecting it.
        for i, wt in _region_weights(
                body, rig,
                [f"metacarpal1.{side}"] + [f"finger1-{s}.{side}"
                                           for s in range(1, 3)],
                o, u_dir, reach=hand_len * 0.30,
                feather_lo=-hand_len * 2.0,
                feather_hi=-hand_len * 1.9).items():
            touched[i] = max(touched.get(i, 0.0), min(wt, 0.42))
        total += n
        log(f"hand {side}: {n} verts hulled")

        # ---------------- foot: sweep from the heel forward to the toe tip
        foot = rig.data.bones.get(f"foot.{side}")
        toe = rig.data.bones.get(f"toe1-1.{side}")
        if foot is None or toe is None:
            log(f"WARNING: foot bones missing for {side}, skipping")
            continue
        ankle = rig.matrix_world @ foot.head_local
        toe_tip = rig.matrix_world @ toe.tail_local
        fwd = (toe_tip - ankle)
        fwd.z = 0.0
        fwd = fwd.normalized() if fwd.length > 1e-6 else Vector((0, -1, 0))
        # anchor the sweep behind the ankle so the heel is inside the region
        o = ankle - fwd * (toe_tip - ankle).length * 0.55
        v_dir = Vector((0, 0, 1)).cross(fwd).normalized()
        w_dir = Vector((0, 0, 1))

        # only the foot proper: including the shin would drag the calf into the
        # hull and balloon the ankle
        z_cut = ankle.z + 0.012 * h
        segs = _bone_segments(rig, [f"foot.{side}", f"toe1-1.{side}"])
        skip = _verts_in_groups(body, ("JointCubes", "HelperGeometry"))
        reach = (toe_tip - ankle).length * 0.75
        mw = body.matrix_world
        weights = {}
        for v in mesh.vertices:
            if v.index in skip:
                continue
            p = mw @ v.co
            if p.z > z_cut:
                continue
            if not any(_seg_project(p, a, b)[1] <= reach for a, b in segs):
                continue
            # feather downwards from the ankle line, and forwards into the toes
            wz = _smoothstep(0.0, 0.55, (z_cut - p.z) / max(1e-6, z_cut - min(
                p.z, ankle.z - 0.09 * h)))
            wu = _smoothstep(-0.35, 0.10, (v.co - o).dot(fwd)
                             / max(1e-6, (toe_tip - o).length))
            wt = max(wz, wu)
            if wt > 0.004:
                weights[v.index] = min(1.0, wt)
        toe_u = ((rig.matrix_world @ toe.head_local) - o).dot(fwd)
        n = _sweep_hull(mesh, weights, o, fwd, v_dir, w_dir,
                        stub_from=toe_u, stub=toe_stub, exponent=3.0,
                        bury=0.32, n_slices=20) or 0
        for i, wt in weights.items():
            touched[i] = max(touched.get(i, 0.0), wt)
        total += n
        log(f"foot {side}: {n} verts hulled (toe stub {toe_stub})")

    mesh.update()

    # A short smooth relaxes the stretched quads the projection leaves where a
    # finger gap used to be. It is scoped to exactly the vertices the hulls
    # actually moved and reuses their feather, so the wrist and ankle are not
    # dragged in -- smoothing a wider region visibly shrinks the whole hand.
    vg = body.vertex_groups.new(name=HAND_VG)
    for i, wt in touched.items():
        vg.add([i], wt, "REPLACE")
    # the amputation caps are new geometry, so they are not in `touched`; the
    # relax pass is what turns each flat stump lid into a dome and it has to
    # reach them
    stump = body.vertex_groups.get(STUMP_VG)
    if stump is not None:
        si = stump.index
        for v in mesh.vertices:
            if any(g.group == si and g.weight > 0.5 for g in v.groups):
                vg.add([v.index], 1.0, "REPLACE")
        body.vertex_groups.remove(stump)

    _select_only(body)
    # Weld first: the collapsed webbing is now a cluster of near-coincident
    # vertices, and merging it removes the zero-area faces that would otherwise
    # flicker on the surface. Only then smooth -- smoothing before the weld just
    # averages the junk back out into the shell.
    weld = body.modifiers.new("JCV_ExtWeld", "WELD")
    weld.vertex_group = HAND_VG
    weld.merge_threshold = 0.0030 * h
    mod = body.modifiers.new("JCV_ExtSmooth", "SMOOTH")
    mod.vertex_group = HAND_VG
    mod.factor = 0.5
    mod.iterations = max(1, smooth_iters)
    for i, m in enumerate((weld, mod)):
        bpy.ops.object.modifier_move_to_index(modifier=m.name, index=i)
    for m in (weld, mod):
        bpy.ops.object.modifier_apply(modifier=m.name)
    body.vertex_groups.remove(body.vertex_groups[HAND_VG])
    log(f"extremities stylised: {total} verts projected onto swept hulls")


# ----------------------------------------------------------------- shorts
def build_shorts(body, rig, hem=0.58, rise=0.050):
    """Model fitted shorts out of the body's own surface.

    The hip/thigh band of the skin is duplicated into its own object, pushed a
    hair outwards and thickened, so the garment follows the anatomy exactly and
    can never intersect it. Because the copy keeps the body's vertex groups, the
    same armature deforms both.

    rise=0.05 keeps the waistband BELOW the navel: with the old high-waisted
    0.105 the lower half of the abs column sat on fabric and the glow pooled
    on the garment instead of the six-pack.
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
    # Snap the cut boundaries onto the exact waist/hem planes. The z cut
    # follows the quad topology, and around the hip crest the quads are
    # 2-4 cm, so the raw waistband edge is a visible zigzag of square
    # notches; the relax modifier softens but never straightens it. The
    # threshold has to be at least one quad tall or the deepest notch verts
    # escape the snap.
    for v in bm.verts:
        if not v.is_boundary:
            continue
        if v.co.z > z_top - 0.040 * h:
            v.co.z = z_top
        elif v.co.z < z_bot + 0.040 * h:
            v.co.z = z_bot
    # The waistband needs a constant depth, and the raw quad topology cannot
    # give one (face-centre tests and top-ring tests both zigzag across the
    # coarse hip quads). Bisecting at the band line inserts a clean edge loop,
    # so the material split is exact; bmesh interpolates the deform layer on
    # the new verts, so the muscle glow weights survive the cut.
    band_z = z_top - 0.022 * h
    bmesh.ops.bisect_plane(bm,
                           geom=list(bm.verts) + list(bm.edges)
                           + list(bm.faces),
                           plane_co=(0.0, 0.0, band_z),
                           plane_no=(0.0, 0.0, 1.0))
    n_band = 0
    for f in bm.faces:
        centre_z = sum(v.co.z for v in f.verts) / len(f.verts)
        f.material_index = 1 if centre_z >= band_z else 0
        n_band += f.material_index
        f.smooth = True
    n_faces = len(bm.faces)
    bm.verts.index_update()
    interior_idx = [v.index for v in bm.verts if not v.is_boundary]
    bm.to_mesh(shorts.data)
    bm.free()

    # The relax must NOT touch the snapped edges, or it drags the straight
    # hems right back into topology-shaped dips.
    hem_free = shorts.vertex_groups.new(name="JCV_HemInterior")
    if interior_idx:
        hem_free.add(interior_idx, 1.0, "REPLACE")

    # The copy KEEPS the body's JCV_<muscle> vertex groups on purpose: the
    # garment covers the glutes, adductors and the upper half of the
    # quads/hamstrings, and the only way those regions stay addressable is for
    # the fabric itself to glow (compression-shorts look, same as the
    # fitonomy/holix reference mannequins). render_exercise.write_mask()
    # writes the muscle_mask attribute on the shorts too; requires
    # bake_muscle_groups() to run BEFORE build_shorts().

    # relax the staircase the quad topology leaves along the cut, so the hem
    # reads as a fabric edge and not as a plate boundary — interior verts
    # only, the snapped boundary edges stay put
    relax = shorts.modifiers.new("Hem", "SMOOTH")
    relax.factor = 0.75
    relax.iterations = 8
    relax.vertex_group = "JCV_HemInterior"
    off = shorts.modifiers.new("Offset", "DISPLACE")
    off.strength = 0.013 * h
    off.mid_level = 0.0
    thick = shorts.modifiers.new("Fabric", "SOLIDIFY")
    thick.thickness = 0.012 * h
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
    nt = fabric.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*GRAPHITE, 1)
    b.inputs["Roughness"].default_value = 0.78
    if "Sheen Weight" in b.inputs:
        b.inputs["Sheen Weight"].default_value = 0.35
        b.inputs["Sheen Roughness"].default_value = 0.45
    if "Specular IOR Level" in b.inputs:
        b.inputs["Specular IOR Level"].default_value = 0.22

    # Muscle glow THROUGH the fabric: the shorts keep the body's JCV_<muscle>
    # vertex groups and receive the same muscle_mask attribute, so covered
    # regions (glutes, adductors, upper quads/hamstrings) light up on the
    # garment — compression-shorts look. Slightly dimmer than skin so the
    # fabric still reads as fabric.
    out = nt.nodes["Material Output"]
    emit = nt.nodes.new("ShaderNodeBsdfPrincipled")
    emit.location = (0, -420)
    emit.inputs["Base Color"].default_value = (0.02, 0.14, 0.17, 1)
    emit.inputs["Roughness"].default_value = 0.55
    emit.inputs["Emission Color"].default_value = (*BRAND_CYAN, 1)
    emit.inputs["Emission Strength"].default_value = 1.15

    attr = nt.nodes.new("ShaderNodeAttribute")
    attr.location = (-200, -200)
    attr.attribute_name = "muscle_mask"
    attr.attribute_type = "GEOMETRY"

    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.location = (280, 0)
    nt.links.new(attr.outputs["Fac"], mix.inputs["Fac"])
    nt.links.new(b.outputs["BSDF"], mix.inputs[1])
    nt.links.new(emit.outputs["BSDF"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])

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

    dir_map = {"front": front, "back": back, "up": up, "down": -up,
               "back_up": (back + up * 0.8).normalized()}

    def vertex_dir(dir_name, p):
        """Resolve a direction spec for the vertex at world position p.
        'out'/'in' depend on which side of the midline the vertex sits, so one
        spec covers both body halves."""
        if dir_name in ("out", "in"):
            outward = lateral if p.dot(lateral) > 0 else -lateral
            return outward if dir_name == "out" else -outward
        return dir_map.get(dir_name)

    for name, parts in MUSCLES.items():
        raw = [0.0] * len(mesh.vertices)
        resolved_any = False
        for spec in parts:
            segs = [bones[b] for b in spec["bones"] if b in bones]
            if not segs:
                log(f"WARNING: no bones resolved for {name} part "
                    f"{spec['bones']}")
                continue
            resolved_any = True
            radius = spec["radius"] * height
            tmin, tmax = spec["t"]
            min_dot = spec["dot"]
            min_side = spec.get("side_dot")
            max_side = spec.get("max_side")
            avoid = spec.get("avoid")

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
                want_dir = vertex_dir(spec["dir"], p)
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
                if max_side is not None:
                    sd = abs(normals[i].dot(lateral))
                    if sd > max_side:
                        continue
                    # feather towards the cut so the column has a soft flank
                    w *= min(1.0, (max_side - sd) / max(1e-3, 0.25))
                if avoid is not None:
                    rules = avoid if isinstance(avoid, list) else [avoid]
                    rejected = False
                    for a_name, a_max in rules:
                        a_dir = vertex_dir(a_name, p)
                        if a_dir is not None and normals[i].dot(a_dir) > a_max:
                            rejected = True
                            break
                    if rejected:
                        continue
                # lateral falloff for symmetric limb muscles is implicit (per-bone)
                raw[i] = max(raw[i], max(0.0, min(1.0, w)))
        if not resolved_any:
            log(f"WARNING: no bones resolved for {name}")
            continue

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
    # Subtle subsurface scattering: softens the terminator and warms the core
    # shadows so the figure reads as vinyl/silicone rather than painted
    # plastic. Deliberately LOW -- weight above ~0.15 makes the mannequin look
    # waxy/translucent, which is wrong for the matte-grey look. The radius is
    # warm-neutral (red scatters a touch further than blue) rather than the
    # fleshy skin preset: this is a mannequin, not a person.
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = 0.10
        bsdf.inputs["Subsurface Radius"].default_value = (0.070, 0.055, 0.045)
        bsdf.inputs["Subsurface Scale"].default_value = 0.030
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

    # IDENTITY ramp: the feather sharpening lives in render_exercise.write_mask
    # (python-side smoothstep) so that per-muscle INTENSITIES survive -- a ramp
    # that expands 0.10..0.55 to 0..1 here would push a 0.35 secondary glow to
    # near-full cyan and erase the primary/secondary distinction.
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.location = (20, -20)
    ramp.color_ramp.interpolation = "LINEAR"
    ramp.color_ramp.elements[0].position = 0.0
    ramp.color_ramp.elements[1].position = 1.0

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


def _resolve_hdri(arg):
    """'auto' -> first .hdr under assets/3d/hdri/ (repo-relative), 'none' ->
    None, anything else is a path. The HDRI is never committed: re-fetch with
    the curl command in scripts/blender/README.md (Poly Haven, CC0)."""
    if arg == "none":
        return None
    if arg != "auto":
        return arg if os.path.isfile(arg) else None
    here = os.path.dirname(os.path.abspath(__file__))
    hdri_dir = os.path.normpath(os.path.join(here, "..", "..",
                                             "assets", "3d", "hdri"))
    if not os.path.isdir(hdri_dir):
        return None
    hdrs = sorted(f for f in os.listdir(hdri_dir)
                  if f.lower().endswith((".hdr", ".exr")))
    return os.path.join(hdri_dir, hdrs[0]) if hdrs else None


def build_world(hdri_path=None, strength=0.30, rotation_deg=205.0):
    """Near-black void to camera, studio HDRI to the surfaces.

    The HDRI is what gives the body image-based speculars and soft ambient
    bounce -- the single biggest free realism jump over pure area lights. But
    the look direction demands a #0a0a0a background, so the world mixes on
    Light Path > Is Camera Ray: camera rays see the flat dark colour, shading
    rays see the HDRI. Strength stays low so the studio never overpowers the
    key/rim area lights; rotation aims the HDRI's softbox at the camera-left
    front, agreeing with KEY. The image is packed into the .blend so renders
    stay headless-reproducible even if assets/3d/hdri/ is wiped.
    """
    world = bpy.data.worlds.new("JCV_World")
    bpy.context.scene.world = world
    world.use_nodes = True
    nt = world.node_tree
    bg = nt.nodes["Background"]
    bg.inputs[0].default_value = (*BG_COLOR, 1)
    bg.inputs[1].default_value = 1.0
    if not hdri_path:
        log("world: flat colour only (no HDRI found)")
        return

    out = nt.nodes["World Output"]
    env_bg = nt.nodes.new("ShaderNodeBackground")
    env_bg.location = (-200, -200)
    env_bg.inputs[1].default_value = strength

    env = nt.nodes.new("ShaderNodeTexEnvironment")
    env.location = (-560, -200)
    env.image = bpy.data.images.load(hdri_path)
    env.image.pack()

    mapping = nt.nodes.new("ShaderNodeMapping")
    mapping.location = (-760, -200)
    mapping.inputs["Rotation"].default_value = (0, 0,
                                               math.radians(rotation_deg))
    coord = nt.nodes.new("ShaderNodeTexCoord")
    coord.location = (-960, -200)

    lp = nt.nodes.new("ShaderNodeLightPath")
    lp.location = (0, 300)
    mix = nt.nodes.new("ShaderNodeMixShader")
    mix.location = (260, 0)

    nt.links.new(coord.outputs["Generated"], mapping.inputs["Vector"])
    nt.links.new(mapping.outputs["Vector"], env.inputs["Vector"])
    nt.links.new(env.outputs["Color"], env_bg.inputs["Color"])
    # factor 1 -> input 2: camera rays get the flat dark colour
    nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs["Fac"])
    nt.links.new(env_bg.outputs["Background"], mix.inputs[1])
    nt.links.new(bg.outputs["Background"], mix.inputs[2])
    nt.links.new(mix.outputs["Shader"], out.inputs["Surface"])
    log(f"world: HDRI {os.path.basename(hdri_path)} "
        f"strength={strength} rot={rotation_deg}")


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
    if args.extremities:
        stylise_extremities(body, rig, toe_stub=args.toe_stub,
                            smooth_iters=args.extremity_smooth)
    # bake BEFORE the shorts: the garment is copied from the body and must
    # inherit the JCV_<muscle> groups so covered regions can glow through it
    bake_muscle_groups(body, rig)
    if args.shorts:
        build_shorts(body, rig)
    build_body_material(body)
    build_world(_resolve_hdri(args.hdri), strength=args.hdri_strength,
                rotation_deg=args.hdri_rotation)
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
