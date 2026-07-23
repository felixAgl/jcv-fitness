# MuscleAtlas

2D anatomical body map (front + back) with individually highlightable muscle
groups — musclewiki-style visual language in JCV's identity: graphite body on
the dark UI, worked muscles in accent cyan.

## Base asset + license

Body silhouette and muscle path data are derived from
[react-native-body-highlighter](https://github.com/HichamELBSI/react-native-body-highlighter)
(**MIT**, (c) 2022 ELABBASSI Hicham), male body, pinned to commit
`15df9e2dbc62`. License verified against the repository `LICENSE` file
(SPDX: MIT) before adoption. No ShareAlike or proprietary sources are used —
MuscleWiki's own SVGs were explicitly avoided.

`atlas-data.ts` (app) and `scripts/reels/assets/muscle-atlas.json` (reels) are
both **generated** by `scripts/muscle-atlas/extract-atlas-data.mjs`, which
fetches the pinned upstream files, merges left/right/common shapes per muscle
and maps upstream slugs to JCV regions. Never hand-edit the generated files;
re-run the script.

## Region mapping

| Upstream slug (view) | JCV region |
| --- | --- |
| chest (front) | `pectorals` |
| deltoids (both) | `delts` |
| biceps (front) | `biceps` |
| triceps (both) | `triceps` |
| forearm (both) | `forearms` |
| abs (front) | `abs` |
| obliques (front) | `obliques` |
| quadriceps (front) | `quads` |
| adductors (both) | `adductors` |
| calves (both) | `calves` |
| trapezius (both) | `traps` |
| upper-back (back) | `lats` |
| lower-back (back) | `lower-back` |
| gluteal (back) | `glutes` |
| hamstring (back) | `hamstrings` |
| head, hair, neck, hands, feet, knees, ankles, tibialis | structural only — never highlighted |

The region ids are the **canonical muscle vocabulary shared with the 3D
mannequin pipeline**: `scripts/blender/build_scene.py` bakes one
`JCV_<region>` vertex group per id and `scripts/blender/muscle_map.json`
translates free-exercise-db muscles onto the same names with the same
approximations, so one exercise definition drives this 2D atlas and the 3D
glow (videos) identically.

Dataset vocabulary (exercise library `target` + `secondary_muscles`) is
normalized onto those regions in `muscle-map.ts`. Documented approximations:
`abductors -> glutes` (gluteus medius region), `serratus anterior -> obliques`,
`hip flexors -> quads`, `levator scapulae -> traps`, `upper back`/`rhomboids ->
lats` (the base asset has a single upper-back shape). Unmapped and silently
skipped: `cardiovascular system`, `ankles`, `feet`, `hands`, `wrists`,
`shins`, `ankle stabilizers`, `sternocleidomastoid`, `neck`.

## Usage

```tsx
import { MuscleAtlas, pickAtlasView } from "@/shared/components/MuscleAtlas";

const view = pickAtlasView([exercise.target], exercise.secondary_muscles);
<MuscleAtlas
  view={view}
  primary={[exercise.target]}
  secondary={exercise.secondary_muscles}
  className="w-14 h-28"
  title="Mapa muscular"
/>;
```

| Prop | Type | Notes |
| --- | --- | --- |
| `view` | `"front" \| "back"` | Which side of the body to draw. |
| `primary` | `string[]?` | Full cyan. Dataset vocabulary, resolved via `muscle-map.ts`. |
| `secondary` | `string[]?` | Cyan at 35% opacity. |
| `className` | `string?` | Always set a width and height (body ratio is 1:2). |
| `title` | `string?` | Present -> `role="img"` + `aria-label` + `<title>`. Absent -> `aria-hidden`. |

### Auto view heuristic (`pickAtlasView`)

Every resolved region votes for its dominant side: anterior regions (pecs,
abs, obliques, biceps, quads, adductors, forearms, delts) vote front, the rest
(lats, traps, triceps, glutes, hamstrings, calves, lower back) vote back.
Primary muscles count x3 so the target always outvotes assistance muscles;
ties go to front. Used by `ExerciseDetailModal` and mirrored in
`scripts/reels/muscle-overlay.mjs` (`pickView`).

## Styling contract

Follows the illustration system palette (`illustrations/README.md`): LINE
(`--text-muted`) for contour + resting muscle definition, ACCENT
(`--accent-cyan`) spent only on highlighted muscles, MASS (`--bg-card`) for the
silhouette fill. Hex fallbacks keep the SVG correct outside the app stylesheet
(tests, reels raster). Contour uses `vector-effect: non-scaling-stroke` so the
outline stays 2px from 80px thumbnails to 400px+ renders.

## Consumers

- `ExerciseDetailModal` — next to the muscle badges, view auto-picked.
- `scripts/reels/muscle-overlay.mjs` — 1080-wide transparent PNG panel for
  reels (`compose-reel.mjs --muscle-map`), rasterized with `@resvg/resvg-js`.
- `scripts/muscle-atlas/render-samples.mjs` — visual validation renders
  (run it and look at `reels-out/atlas-samples/` before touching atlas
  styling or data).
