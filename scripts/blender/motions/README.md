# Motion library

One JSON file per exercise. `render_exercise.py --motion <name>` resolves
`scripts/blender/motions/<name>.json`; there is no hard-coded list of motions,
so **adding exercise #2..N is config, not code**.

```bash
scripts/blender/render.sh render --motion squat --muscle quads --views side --frames 1-48
BLENDER_USER_EXTENSIONS=assets/3d/blender-extensions \
  blender -b assets/3d/jcv_mannequin.blend -P scripts/blender/render_exercise.py -- --list-motions
```

| Motion | Type | What it is |
| --- | --- | --- |
| `squat` | bvh | one bodyweight squat rep to just below parallel, retargeted from CMU mocap. The hero motion. |
| `squat-procedural` | procedural | analytic squat. No external data, so it still works when `assets/3d/` has been wiped. |
| `curl` | procedural | two-arm biceps curl. |
| `none` | rest | relaxed standing pose, one frame. For stills and camera work. |

## Schema

### Common fields

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `name` | string | file stem | Informational; the filename is what `--motion` matches. |
| `description` | string | — | Free text. |
| `type` | `"bvh"` \| `"procedural"` \| `"rest"` | **required** | Which backend keyframes the rig. |
| `loop` | bool | `true` | `true` samples the source over a half-open range so frame `N+1` would equal frame `1` — no duplicated pose when the clip is looped. `false` includes both endpoints. |
| `root.ground_clamp` | `false` \| `"feet"` \| `"bones"` \| `"mesh"` | `"feet"` (bvh) / `false` (procedural) | See **Ground clamp** below. |

### `type: "bvh"`

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `skeleton` | string | `"cmu"` | Key into `SKELETONS` in `motion.py`. Defines the import axes, the source→target bone map, the scale reference and the heading reference. |
| `source.file` | path | **required** | BVH path, relative to the repo root. **Not committed** — `assets/3d/` is gitignored. |
| `source.dataset` / `.clip` / `.licence` / `.url` / `.acknowledgement` / `.conversion` | string | — | Provenance. Not optional in practice: the licence line is printed on every run, and a missing file produces an error that names the dataset and URL so the clip can be re-fetched. |
| `range.start` / `range.end` | int | clip bounds | Blender frame numbers in the imported clip (**file frame index + 1**, because the importer is called with `frame_start=1`). |
| `range.fit_cycle` | bool | `true` | Resample `[start, end]` into exactly `--rep-frames` output frames. This is what keeps `--rep-frames 48` meaningful for mocap: CMU is 120 fps, and you want ~24-30. |
| `range.step` | float | `1` | Used only when `fit_cycle` is `false`: take every Nth source frame instead. |
| `range.comment` | string | — | Why this range. Write it down; finding a clean rep in a 10 000-frame clip is the expensive part. |
| `root.lock_xy` | bool | `true` | Discard the actor's horizontal travel so the figure stays framed. Turn off for walks. |
| `root.root_height` | `"follow"` \| `"planted"` \| `"none"` | `"follow"` | `follow` drives `rig.location.z` from the mocap hips; `planted`/`none` leave it at 0 and let the ground clamp do the work. With a clamp enabled the three converge. |
| `align_rest` | bool | skeleton default | Snap each target bone's **rest direction** onto its source's before retargeting. See **A-pose vs T-pose**. |
| `align_facing` | bool | `true` | Cancel the actor's compass heading at `range.start` so the figure faces the camera. Heading *changes* during the clip still come through. |
| `influence` | `{bone: 0..1}` | `{}` | Per-target-bone damping, slerped from rest (0) to fully retargeted (1). Used to take the jitter out of toe and finger bones. |

### `type: "procedural"`

| Field | Type | Meaning |
| --- | --- | --- |
| `poser` | `"squat"` \| `"curl"` | Key into `POSERS` in `motion.py`. |
| `params` | object | Poser-specific angles in degrees. `squat`: `hip_deg`, `knee_deg`, `ankle_deg`, `spine_deg`, `arm_deg`. `curl`: `elbow_deg`, `spine_deg`. |

The rep phase is `t = 0.5 - 0.5*cos(2*pi*u)` — a cosine ease that holds at the
top and the bottom, so the movement does not read as a metronome.

### `type: "rest"`

| Field | Type | Default | Meaning |
| --- | --- | --- | --- |
| `arms_down` | bool | `true` | Relax the MakeHuman A-pose into a natural standing posture. |

## How the BVH retarget works

**World-space rotation deltas.** For every mapped pair (source bone `S`,
target bone `T`), per frame:

```
R_delta = S.matrix_3x3 @ S_rest_world_3x3.inverted()
T.matrix = Translation(T.matrix.translation) @ (R_delta @ T_ref_world_3x3).to_4x4()
```

Each bone is driven by *how far it moved from its own rest*, never by an
absolute orientation, so the two skeletons need not share a rest pose, bone
lengths, bone count or roll conventions. Target bones are written **parents
first**, with a `view_layer.update()` on either side of the assignment, because
`pose_bone.matrix` is a world-space *setter* resolved against the current
parent state.

Only mapped bones are touched. Face, finger and breast bones stay at rest.

**One source bone may drive several target bones.** `LeftUpLeg` → `upperleg01.L`
*and* `upperleg02.L`. Because each target is written as an absolute world
orientation the rotation is applied once, not compounded down the chain; the
two bones simply behave as one rigid segment.

## A-pose vs T-pose (`align_rest`)

CMU rests in a T-pose; the MakeHuman mannequin rests in an A-pose. Pure delta
retargeting therefore leaves a permanent bias equal to the rest mismatch —
measured on this pair: 52° on the upper arms, 55-65° on the forearms, 118° on
the wrists. The arms end up pointing down and behind the body no matter what
the actor does.

`align_rest` fixes it with no per-bone hand-authoring: before retargeting, each
target bone's rest matrix is pre-rotated by the shortest arc that takes its
rest **direction** onto the source's rest direction. "Source at rest" then
really does mean "target at rest", and the bias goes to zero.

`SKELETONS["cmu"]["align_exclude"]` holds the bones this must *not* be done to.
`Hips` is excluded: the MakeHuman `root` is a 1 cm stub whose axis is a rigging
convention rather than a limb direction, and aligning it tips the whole figure
over by 81°.

## Heading (`align_facing`)

Mocap actors do not face the BVH rest direction — subject 86 stands 89° off,
subject 22 stands 76° off. The correction is derived from a **hip-to-hip
vector**, not from a quaternion twist: swing-twist decomposition about Z flips
sign when the pelvis is tilted, which silently turns the figure 180° and
renders its back to the camera.

## Ground clamp

Per frame, the rig is offset in Z so the figure stands on `z = 0`.

* `"feet"` — lowest **evaluated mesh vertex near a foot/toe bone**, found
  geometrically. This is the right default. A whole-body clamp is wrong for a
  squat: at the bottom the lowest point of the mesh is the glutes, so the
  figure is lifted until its feet hover.
* `"bones"` — foot/toe bone endpoints plus a constant sole thickness sampled at
  rest. Free, but 2-6 cm of sole sinks through the floor once the ankle
  pitches, because the offset cannot be constant.
* `"mesh"` — lowest vertex of the whole body. Right for push-ups and floor
  work, wrong for anything standing.
* `false` — no clamp.

The `"feet"` mode must not use vertex *indices*: `JCV_Body` carries a MASK
modifier that drops the MakeHuman helper geometry, so original (19158) and
evaluated (13380) vertex indices do not line up.

## Adding a new motion

1. Find a rep. For CMU, the hip height is column 2 of the BVH motion block;
   scan it for dips and pick one whose minimum is **~0.55 of standing height**.
   Below ~0.45 you get an ass-to-grass squat that reads as a collapse on a
   stylised mannequin (this is why subject 22's clips were rejected).
2. Copy `squat.json`, point `source.file` at the clip, set `range.start` /
   `range.end` to **file frame index + 1**, and write down why in
   `range.comment`.
3. Render and look at it:
   ```bash
   scripts/blender/render.sh render --motion <name> --views side,three_quarter \
       --frames 1-48 --out out-3d/check --samples 16 --res 540x960
   ffmpeg -i out-3d/check/none_side_%04d.png \
       -vf "select='not(mod(n\,4))',scale=200:356,tile=6x2" -frames:v 1 sheet.png
   ```
4. Check the feet do not sink or float and no joint bends backwards.

## Adding a new source skeleton

Add an entry to `SKELETONS` in `motion.py`. No new code:

| Key | Meaning |
| --- | --- |
| `import` | kwargs forwarded to `bpy.ops.import_anim.bvh` — `axis_forward`, `axis_up`, `global_scale`, `rotate_mode`. Aim for Z-up, figure facing `-Y`. |
| `root` | source root bone name. |
| `scale_ref` | `[[src_a, src_b], [tgt_a, tgt_b]]` — the head-to-head distance of each pair defines the uniform scale between skeletons (leg length is a good choice). |
| `bones` | `{source_bone: [target_bone, ...]}`. |
| `align_rest` / `align_exclude` | see above. |
| `heading_ref` | two **target** bones whose head-to-head vector is "the way the figure faces". |

## Licence

The `squat` motion is derived from the **CMU Graphics Lab Motion Capture
Database**, <http://mocap.cs.cmu.edu/>. Verbatim from that site:

> This dataset of motions is free for all uses.

and, from the same page:

> This data is free for use in research projects. You may include this data in
> commercially-sold products, but you may not resell this data directly, even
> in converted form. If you publish results obtained using this data, we would
> appreciate it if you would send the citation to your published paper to
> jkh+mocap@cs.cmu.edu, and also would add this text to your acknowledgments
> section: The data used in this project was obtained from mocap.cs.cmu.edu.
> The database was created with funding from NSF EIA-0196217.

> The collection of the data in this database was supported by NSF Grant #0196217.

That is why CMU was chosen: rendered output may ship commercially. What we ship
is rendered frames, not the motion data, so the no-resale clause is not
engaged. The acknowledgement text belongs in the credits of anything published
from these renders.

The BVH conversion used here is mirrored from
<https://github.com/una-dinosauria/cmu-mocap> (the CMU dataset, converted).

`assets/3d/` is gitignored, so the clips are **not** in the repo. Fetch the ones
the shipped motions reference:

```bash
ROOT="$(git rev-parse --show-toplevel)"
mkdir -p "$ROOT/assets/3d/mocap/cmu"
for f in 086/86_02; do
  curl -sL -o "$ROOT/assets/3d/mocap/cmu/$(basename $f).bvh" \
    "https://raw.githubusercontent.com/una-dinosauria/cmu-mocap/master/data/$f.bvh"
done
```

Other clips worth knowing about, from `cmu-mocap-index-text.txt`: `13_29`,
`13_30`, `14_06` (jumping jacks / side twists / squats), `22_14` (alternating
squats, but ass-to-grass), `144_17` (lunges).

**Forbidden for this project**, regardless of convenience: AMASS, Fit3D,
FLAG3D, Mixamo, and any stock or marketplace motion. All are non-commercial or
restrictively licensed.
