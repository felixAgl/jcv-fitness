# 3D exercise prototype (Blender + EEVEE)

Proof of concept for JCV 24 Fitness: a real 3D rigged body that can be rendered
from **any camera angle** with **any single muscle group glowing brand cyan** —
something a flat 2D exercise video can never do.

Reference look: fitonomy.coach / holix_gym / gym.advice reels — a smooth,
stylised **athletic** mannequin in shorts with a featureless head, near-black
studio, one glowing target muscle, 9:16.

## Requirements

| Tool | Version used | Notes |
| --- | --- | --- |
| Blender | 5.2 LTS | `/Applications/Blender.app/Contents/MacOS/Blender`, runs headless with `-b` |
| ffmpeg | 8.x (`ffmpeg-full`) | needs `drawtext` for the labelled contact sheets |
| MPFB2 | 2.0.8 | MakeHuman for Blender, provides the rigged body |

### Installing MPFB2 (one-off, ~75 MB, not committed)

MPFB2 ships as a Blender **extension** (it has a `blender_manifest.toml`), so
`bpy.ops.preferences.addon_install()` on the release zip fails with
*"ZIP packaged incorrectly"*. Unpack it into an extensions repo instead:

```bash
ROOT="$(git rev-parse --show-toplevel)"
mkdir -p "$ROOT/assets/3d/blender-extensions/user_default/mpfb"
curl -L -o /tmp/mpfb.zip \
  https://github.com/makehumancommunity/mpfb2/releases/download/v2.0.8/mpfb-2.0.8.zip
unzip -q /tmp/mpfb.zip -d "$ROOT/assets/3d/blender-extensions/user_default/mpfb"
```

`render.sh` exports `BLENDER_USER_EXTENSIONS=assets/3d/blender-extensions`, so
the addon resolves as `bl_ext.user_default.mpfb` without touching the user's own
Blender configuration.

### Licensing

* **MPFB2 / MakeHuman code**: GPLv3 — we only run it, we do not redistribute it.
* **Generated assets** (the mesh, the rig, anything exported): **CC0**, public
  domain, explicitly usable commercially. This is the reason MPFB2 was chosen
  over Mixamo / free-but-restricted marketplace models.

Everything under `assets/3d/` and `out-3d/` is gitignored — regenerate with the
commands below.

## Usage

```bash
# 1. build the mannequin asset (~2 s)
scripts/blender/render.sh build

# which muscle groups exist
scripts/blender/render.sh muscles
#   abs biceps calves deltoids glutes hamstrings lats pectorals quads triceps

# 2. render
scripts/blender/render.sh render \
    --muscle quads \
    --views front,three_quarter,side,top,closeup \
    --frames 1-48 \
    --out out-3d/run1

# raw form (what render.sh wraps)
BLENDER_USER_EXTENSIONS=assets/3d/blender-extensions \
blender -b assets/3d/jcv_mannequin.blend -P scripts/blender/render_exercise.py -- \
    --muscle quads --views front --frames 1-48 --out out-3d/run1

# 3. the owner-facing proofs (~4 min at 128 samples)
scripts/blender/render.sh demo

# with a before/after panel against a previous mannequin, under its own prefix
PREFIX=3d-v2 BLEND_PREV=assets/3d/jcv_mannequin_v1.blend \
  scripts/blender/render.sh demo
```

### build_scene.py flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `--muscle` | `1.0` | MakeHuman macro muscle, 0..1 |
| `--weight` | `0.60` | macro weight, 0..1 |
| `--gender` | `0.95` | 0 = female, 1 = male |
| `--athletic` | `1.0` | multiplier on the whole detail-target stack |
| `--head-smooth` | `40` | smoothing iterations used to melt the face |
| `--no-shorts` | off | skip the procedural garment |
| `--no-abstract-head` | off | keep the MakeHuman face |
| `--no-floor` | off | pure void, no ground plane or contact shadow |

### render_exercise.py flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `--muscle` | `none` | muscle to light up (`quads`, `pectorals`, …) |
| `--views` | `front` | `front,three_quarter,side,back,top,closeup,orbit` |
| `--frames` | `24` | `24` or `1-48` |
| `--rep-frames` | `48` | frames in one full rep (named this way because Blender itself swallows anything starting with `--cycle`) |
| `--motion` | `squat` | `squat`, `curl`, `none` |
| `--samples` | `48` | EEVEE TAA samples |
| `--res` | `1080x1920` | output resolution |
| `--orbit-degrees` | `110` | azimuth swept by the `orbit` view |
| `--out` | `out-3d` | output directory |

## How it works

**Physique.** `build_scene.py` drives `HumanService.create_human()` directly
rather than the `mpfb.create_human` operator, which is what allows *continuous*
macro values (`muscle`, `weight`, `proportions`, …) instead of the operator's
min/average/max enums. On top of the macro shape it stacks ~26 MakeHuman detail
targets from MPFB2's own `data/targets/` library — `torso-vshape-incr`,
`torso-muscle-pectoral-incr`, `l/r-upperarm-muscle-incr`,
`l/r-upperleg-muscle-incr`, `stomach-tone-incr`, `measure-waist-circ-decr` and
friends — loaded as shape keys through `TargetService.bulk_load_targets()` and
then frozen with `TargetService.bake_targets()`. Baking *before* the rig is
added matters: the rig fits itself to the mesh, and un-baked shape keys leave
`mesh.vertices[i].co` holding the un-sculpted basis.

**Abstract head.** A feathered vertex group covers the skull (1 over the face,
0 at the neck, joint cubes and helper geometry excluded so the rig still fits).
The face is first blended towards the ellipsoid that encloses the skull — this,
not smoothing, is what actually removes the eyes and lips — then a `SMOOTH` and
a volume-preserving `LAPLACIANSMOOTH` modifier polish it into a clean ovoid.
Ears and nose are pre-shrunk with the `l/r-ear-scale-decr` and
`nose-scale-*-decr` targets so they do not survive in the silhouette.

**Shorts.** Modelled from the body's own surface, so they are CC0 like the rest
and can never intersect the anatomy: the hip/thigh band of the skin is
duplicated into `JCV_Shorts`, relaxed, pushed out along its normals and
thickened with `SOLIDIFY`. Because the copy keeps the body's vertex groups the
same armature deforms both. Two material slots: graphite fabric, plus a thin
cyan-emissive waistband. Note the band selection must run *after* the material
slots exist — with a single slot Blender clamps every `material_index` back to 0
and the waistband silently vanishes.

**Muscle glow.** `build_scene.py` bakes one vertex group per muscle
(`JCV_quads`, `JCV_pectorals`, …). Regions are defined *relative to the rig* —
a list of bones, a normalised range along each bone, and a required surface
normal direction (front / back, optionally "sides only") — never as absolute
world coordinates, so they survive a change of body proportions. The raw mask is
blurred across mesh edges so the glow has a soft edge.

At render time `--muscle X` copies that vertex group into a `muscle_mask`
colour attribute; the body material is a Mix Shader between matte grey and a
cyan emissive Principled BSDF, driven by that attribute.

**Cameras.** Computed from the *evaluated* mesh bounds and the mannequin's
facing axis, then cached from the mid-point of the movement so the camera stays
static while the body moves through frame. `closeup` aims at the centroid of the
currently glowing muscle along its own average surface normal.

**Motion.** A procedural 2-link squat keyframed onto the rig: hip flexion `θ`,
knee `-2θ`, ankle `+θ`, and the root dropped by `(l1+l2)(1-cos θ)` so the feet
stay planted. Crude but anatomically coherent — it is a pipeline proof, not
mocap.

## Gotchas found on Blender 5.2

* The engine enum is `BLENDER_EEVEE` again (not `BLENDER_EEVEE_NEXT`).
* EEVEE has no bloom toggle. Glow comes from a compositor Glare node in
  `scene.compositing_node_group`.
* **A scene compositing node group is NOT auto-fed with the render result.** A
  `Group Input → Glare → Group Output` chain renders pure white. The group must
  read the render through a `CompositorNodeRLayers` node.
* Glare parameters are input *sockets* now (`Type`, `Strength`, …), not RNA
  properties.
* The MakeHuman rig ships with euler bones — set `rotation_mode` to
  `QUATERNION` **before** posing, or your `rotation_quaternion` keyframes are
  silently ignored.
* The MakeHuman spine is numbered top-down: `spine01` is at the neck,
  `spine05` at the pelvis.
* The MakeHuman rest pose is an **A-pose**, not a T-pose, so the hands hang at
  hip height. Anything that selects geometry by a z band (the shorts) has to
  also test proximity to the pelvis/thigh bones, or the hands get welded into
  the garment and solidify into spikes.
* The ground plane must be **matte**. A glossy floor mirrors the studio area
  lights into a blown-out white blob across the bottom of a 9:16 frame. It also
  needs a spherical-gradient fade to transparent, otherwise the plane reads as a
  lit stage instead of a void. Blender's spherical gradient is `1` at the origin
  and `0` at the edge, and a Mix Shader picks input **2** at factor `1` — so the
  ramp runs white (far → transparent) to black (under the figure → opaque).
