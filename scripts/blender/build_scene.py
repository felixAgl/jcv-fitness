"""
Build the JCV 24 Fitness 3D mannequin scene (headless).

Generates a rigged CC0 human with MPFB2 (MakeHuman for Blender), bakes named
muscle-region vertex groups onto it, sets up the dark-studio look and saves a
.blend asset that `render_exercise.py` consumes.

Usage:
    BLENDER_USER_EXTENSIONS=<ext-dir> blender -b -P scripts/blender/build_scene.py -- \
        --out assets/3d/jcv_mannequin.blend

MPFB2 is GPLv3 code, but every asset it generates is CC0 (public domain).
See scripts/blender/README.md for how to install it.
"""

import sys
import os
import argparse
import math

import bpy
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

BRAND_CYAN = (0.133, 0.827, 0.933)   # #22d3ee, linear-ish
BG_COLOR = (0.0039, 0.0039, 0.0039)  # ~#0a0a0a


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
    p.add_argument("--gender", default="male",
                   choices=["neutral", "male", "female"])
    p.add_argument("--muscle-level", default="maxmuscle",
                   choices=["minmuscle", "averagemuscle", "maxmuscle"])
    p.add_argument("--floor", action="store_true",
                   help="add a dark ground plane (off by default)")
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


# ------------------------------------------------------------- body + rig
def create_body(gender, muscle_level):
    sc = bpy.context.scene
    sc.MPFB_NH_phenotype_gender = gender
    sc.MPFB_NH_phenotype_muscle = muscle_level
    sc.MPFB_NH_phenotype_weight = "averageweight"
    sc.MPFB_NH_phenotype_height = "average"
    sc.MPFB_NH_phenotype_age = "young"
    sc.MPFB_NH_phenotype_proportions = "average"
    sc.MPFB_NH_add_phenotype = True
    sc.MPFB_NH_phenotype_influence = 0.9
    bpy.ops.mpfb.create_human()

    body = bpy.data.objects["Human"]
    body.name = "JCV_Body"

    bpy.context.view_layer.objects.active = body
    for o in bpy.data.objects:
        o.select_set(o is body)

    sc.MPFB_ADR_standard_rig = "default_no_toes"
    sc.MPFB_ADR_import_weights = True
    bpy.ops.mpfb.add_standard_rig()

    rig = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    rig.name = "JCV_Rig"
    log(f"body={len(body.data.vertices)} verts  rig={len(rig.data.bones)} bones")
    return body, rig


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
    bsdf.inputs["Roughness"].default_value = 0.52
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.35
    if "Subsurface Weight" in bsdf.inputs:
        bsdf.inputs["Subsurface Weight"].default_value = 0.0

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
    """Optional dark ground. Off by default: the fitonomy-style reference look
    is a pure dark void, and a lit floor washes out the bottom of a 9:16 frame."""
    h = body.dimensions.z
    bpy.ops.mesh.primitive_plane_add(size=h * 12, location=(0, 0, -0.002))
    floor = bpy.context.object
    floor.name = "JCV_Floor"
    mat = bpy.data.materials.new("JCV_Floor")
    mat.use_nodes = True
    b = mat.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.003, 0.0035, 0.004, 1)
    b.inputs["Roughness"].default_value = 0.55
    b.inputs["Metallic"].default_value = 0.0
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
    body, rig = create_body(args.gender, args.muscle_level)
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
