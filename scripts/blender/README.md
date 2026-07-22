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

### Studio HDRI (one-off, ~6 MB each, not committed)

The scene is lit by a Poly Haven studio HDRI on top of the area-light rig.
`build_scene.py --hdri auto` picks the first `.hdr` in `assets/3d/hdri/`:

```bash
ROOT="$(git rev-parse --show-toplevel)"
mkdir -p "$ROOT/assets/3d/hdri"
for h in studio_small_08 studio_small_09; do
  curl -sL -o "$ROOT/assets/3d/hdri/${h}_2k.hdr" \
    "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/${h}_2k.hdr"
done
```

`studio_small_08` (low contrast, the default by sort order) and
`studio_small_09` (medium contrast) are both **CC0** (public domain,
https://polyhaven.com/license), chosen because their dark rooms with a few
softboxes match the near-black studio look. The image is packed into the
generated `.blend`, so renders keep working even if `assets/3d/hdri/` is wiped.

### free-exercise-db (one-off, ~1.5 MB, not committed)

`render_exercise.py --exercise-name` resolves exercises against a local copy of
free-exercise-db (https://github.com/yuhonas/free-exercise-db, **Unlicense /
public domain**). Only the JSON metadata is used — never its exercise images:

```bash
ROOT="$(git rev-parse --show-toplevel)"
mkdir -p "$ROOT/assets/3d/free-exercise-db"
curl -sL -o "$ROOT/assets/3d/free-exercise-db/exercises.json" \
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json"
```

NB: our own exercise library (`public/data/exercise-library.json`) has
**different ids**. No bridge is attempted here — `--exercise-name` is a
Blender-pipeline-only feature until an id mapping exists.

### Licensing

* **MPFB2 / MakeHuman code**: GPLv3 — we only run it, we do not redistribute it.
* **Generated assets** (the mesh, the rig, anything exported): **CC0**, public
  domain, explicitly usable commercially. This is the reason MPFB2 was chosen
  over Mixamo / free-but-restricted marketplace models.
* **Poly Haven HDRIs**: CC0.
* **free-exercise-db JSON**: Unlicense (public domain).

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

# 2b. or let free-exercise-db pick the muscles: primaries glow at 1.0,
#     secondaries at 0.35 (bench press = pectorals + dim deltoids/triceps)
scripts/blender/render.sh render \
    --exercise-name "Barbell Bench Press - Medium Grip" \
    --views three_quarter --frames 26 --out out-3d/run2

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
| `--no-stylise-extremities` | off | keep MakeHuman's literal fingers and toes |
| `--toe-stub` | `0.52` | toe length past the ball of the foot |
| `--extremity-smooth` | `14` | relax iterations over the hands and feet |
| `--hdri` | `auto` | studio HDRI: `auto` = first `.hdr` in `assets/3d/hdri/`, `none`, or a path |
| `--hdri-strength` | `0.30` | world strength; 0.55 halos the figure through the bloom pass |
| `--hdri-rotation` | `205` | Z rotation in degrees, aims the softbox at the camera-left front |

### render_extremities.py flags

A review tool, not part of the pipeline: it frames the hands and the feet from
cameras derived from the **rig**, so the identical shot can be rendered against
two different `.blend` files and stacked into a before/after panel.

| Flag | Default | Meaning |
| --- | --- | --- |
| `--parts` | `hands,feet` | which close-ups to render |
| `--pose` | `rest` | `rest`, or `flex` to curl the fingers and rock the ankles |
| `--samples` | `64` | EEVEE TAA samples |
| `--res` | `900x900` | output resolution |
| `--out` | `out-3d/ext` | output directory |

```bash
BLEND=assets/3d/jcv_mannequin_v3.blend \
BLEND_PREV=assets/3d/jcv_mannequin_v2.blend \
PREFIX=3d-v3 scripts/blender/make_extremity_demo.sh
```

### render_exercise.py flags

| Flag | Default | Meaning |
| --- | --- | --- |
| `--muscle` | `none` | muscle to light up (`quads`, `pectorals`, …); manual override that wins over `--exercise-name` |
| `--exercise-name` | – | free-exercise-db exercise (name or id); primaries glow at 1.0, secondaries at 0.35, resolved through `muscle_map.json` |
| `--views` | `front` | `front,three_quarter,side,back,top,closeup,orbit` |
| `--frames` | `24` | `24` or `1-48` |
| `--rep-frames` | `48` | frames in one full rep (named this way because Blender itself swallows anything starting with `--cycle`) |
| `--motion` | `squat` | name of a JSON motion in `motions/`; free-form, not a fixed list |
| `--samples` | `48` | EEVEE TAA samples |
| `--res` | `1080x1920` | output resolution |
| `--orbit-degrees` | `110` | azimuth swept by the `orbit` view |
| `--out` | `out-3d` | output directory |
| `--list-muscles` | off | print the muscle groups baked into the .blend and exit |
| `--list-motions` | off | print the motions in `motions/` and exit |

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

**Hands and feet.** MakeHuman ships anatomically literal extremities — five
separated toes with toenails, five separated fingers. Against a stylised body
with a featureless head that is the loudest remaining "generic 3D render" tell,
so both are reduced to simple masses. They need *different* treatments:

*Feet* get a **swept hull**. The region is sliced along the heel→toe axis, each
slice is described by a superellipse fitted to that slice's own outline, the
profiles are blurred along the sweep, and every vertex is pushed onto the
result. The gaps between the toes are interior to the profile so they fill in,
while the profile is measured from the real anatomy and keeps the foot's true
proportions — `_ovoid_head()`'s trick generalised from one ellipsoid to a swept
one. The superellipse exponent (3.0) keeps the sole flat enough to stand on.

*Hands* cannot be done that way, and it is worth knowing why before trying
again. Fingers are half the length of the hand, so a hull spanning them has to
bridge gaps as long as the geometry itself; push the webbing outwards and the
shells cross into visible cracks, collapse it inwards and you get open notches.
Telescoping the fingers into the palm instead just interpenetrates five shells
in a few millimetres and shatters into facets. So fingers 2..5 are **amputated**
at the knuckles and the opening is domed shut with shrinking ring extrusions
(a single `pointmerge` of that whole loop makes a broad flat cone that reads as
a sheet of card stapled across the knuckles; `holes_fill` caps it with an n-gon
that shatters under projection). The thumb is left untouched — it is the only
thing keeping the silhouette reading as a hand rather than a paddle.

Verify with `render_extremities.py --pose flex`, which curls the fingers and
rocks the ankles: a stylisation that only survives the rest pose is worthless.

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
cyan emissive Principled BSDF, driven by that attribute. The material's ramp is
an **identity** ramp on purpose: the feather sharpening (smoothstep over
0.10..0.55 of the group weight) happens python-side in `write_mask()`, *before*
the per-muscle intensity is multiplied in. With the sharpening in the material
instead, a 0.35 secondary glow gets expanded right back to near-full cyan and
the primary/secondary distinction dies.

`--exercise-name "<name or id>"` looks the exercise up in the local
free-exercise-db JSON and glows several muscles at once: `primaryMuscles` at
full intensity, `secondaryMuscles` at 35 %, translated through
[`muscle_map.json`](muscle_map.json). That file also documents which
free-exercise-db muscles have **no** vertex group on the mannequin (abductors,
adductors, forearms, lower back, neck, traps map to `null` and are skipped with
a log line) and the one deliberate approximation (`middle back` → `lats`).
Overlapping groups keep the max intensity per vertex. `--muscle` still works as
a manual override.

**Body material.** Matte grey with a *subtle* subsurface term (weight 0.10,
warm-neutral radius 0.070/0.055/0.045, scale 0.03): it softens the terminator
and lifts the core shadows so the figure reads as vinyl/silicone instead of
painted plastic. Anything above ~0.15 reads waxy. The sheen tint stays for the
fabric-like grazing highlight.

**Lighting.** The three-point area rig plus a Poly Haven studio HDRI
(`studio_small_08`, CC0, strength 0.30, rotated 205° so its softbox agrees with
KEY). The world mixes on `Light Path > Is Camera Ray`: camera rays see the flat
`#0a0a0a` void, shading rays see the HDRI — image-based speculars and ambient
bounce without giving up the near-black background. Strength matters: at 0.55
the whole figure crosses the compositor bloom threshold and grows a milky halo.

**Cameras.** Computed from the *evaluated* mesh bounds and the mannequin's
facing axis, then cached from the mid-point of the movement so the camera stays
static while the body moves through frame. `closeup` aims at the centroid of the
currently glowing muscle along its own average surface normal.

**Motion.** `--motion <name>` resolves `motions/<name>.json` — a motion
*library*, not a fixed enum, so exercise #2..N is config rather than code. Full
schema in [`motions/README.md`](motions/README.md); `motion.py` is the module
that reads it.

The hero motion (`squat`) is **real mocap**: one below-parallel bodyweight squat
from the CMU Graphics Lab Motion Capture Database (subject 86, trial 2),
imported as BVH and retargeted onto `JCV_Rig` at run time. CMU data is *"free
for all uses"* including commercial products — the reason it was chosen over
AMASS / Mixamo / marketplace motion, all of which are forbidden here. Exact
wording, URL and the required acknowledgement are in `motions/README.md`; the
licence line is also printed on every render.

Retargeting is **world-space rotation deltas**: each target bone is driven by
how far its source bone moved from its *own* rest, so the two skeletons share
no rest pose, bone count, bone length or roll convention. On top of that, three
things are needed to make it actually look like a person:

* *Rest alignment.* CMU rests in a T-pose, MakeHuman in an A-pose. Raw deltas
  leave a permanent 52-118° bias on the arms. Each target bone's rest is
  pre-rotated onto its source's rest direction, which zeroes it — except for
  `root`, a 1 cm stub whose axis is a rigging convention, where doing so tips
  the figure over by 81°.
* *Heading cancellation.* Actors do not face the BVH rest direction (subject 86
  stands 89° off). Derived from a hip-to-hip vector, because a quaternion
  swing-twist about Z flips sign on a tilted pelvis and turns the figure 180°.
* *Ground clamp.* The rig is offset in Z each frame so the **feet** sit on
  z=0 — specifically the evaluated mesh near the foot bones, since at the
  bottom of a squat the lowest point of the whole body is the glutes.

Raw mocap is not shippable as-is, so `squat.json` damps individual bones through
`influence`. Damping only bites where the source delta is large, so the standing
frames stay untouched. Three lessons paid for in renders:

* **Never damp `root`.** The heading correction is baked into the root delta, so
  damping it turns the whole figure away from camera — the one knob in the file
  that silently breaks the shot rather than the pose.
* *Legs at ~0.75.* Subject 86 squats well below parallel. The procedural shorts
  are a solidified band cut from the body and they invert at that much hip
  flexion, tearing open across the glutes. Damping the legs brings the rep to
  parallel, where the garment survives. Thickening the garment does not fix it;
  the failure is linear-blend skinning, not penetration.
* *Spine at ~0.5.* Subject 86 hip-hinges hard enough to fold the chest onto the
  thighs, which reads as a good-morning, not a squat.

One camera note belongs here too: `fit_distance()` needs the view direction.
Without it the horizontal fit falls back to `max(size.x, size.y)`, and once the
mocap arms reach forward, a *depth* that is never on screen drives the framing
and shrinks the figure to half the height of a 9:16 frame.

`squat-procedural` and `curl` keep an analytic path with no external data:
hip/knee/ankle angles, spine hinge, arm counterbalance and a cosine ease that
holds at the top and bottom of the rep. Useful as a fallback, since the BVH
clips live under the gitignored `assets/3d/`.

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
* `pose_bone.matrix` is a **world-space setter resolved against the current
  parent state**. Write retargeted bones parents-first with a
  `view_layer.update()` on either side, or children land on stale parents.
* `bpy.ops.import_anim.bvh(frame_start=1)` puts BVH file frame **index 0 on
  Blender frame 1**, so a range picked by scanning the text file is off by one
  unless you add 1.
* `JCV_Body` has a MASK modifier (19158 original verts → 13380 evaluated), so
  original and evaluated vertex **indices do not correspond**. Anything that
  selects mesh regions on the evaluated mesh has to do it geometrically.
* The ground plane must be **matte**. A glossy floor mirrors the studio area
  lights into a blown-out white blob across the bottom of a 9:16 frame. It also
  needs a spherical-gradient fade to transparent, otherwise the plane reads as a
  lit stage instead of a void. Blender's spherical gradient is `1` at the origin
  and `0` at the edge, and a Mix Shader picks input **2** at factor `1` — so the
  ramp runs white (far → transparent) to black (under the figure → opaque).
