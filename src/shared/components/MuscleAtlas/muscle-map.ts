import type { AtlasRegionId, AtlasView } from "./atlas-data";
import { ATLAS_REGIONS } from "./atlas-data";

/**
 * Dataset muscle vocabulary (exercise library `target` + the wider
 * `secondary_muscles` strings) -> atlas region. Keys are lowercase.
 *
 * Anatomical approximations, on purpose:
 * - "abductors"          -> glutes (gluteus medius/minimus are the main hip abductors)
 * - "serratus anterior"  -> obliques (adjacent lateral-torso region, no own shape)
 * - "hip flexors"        -> quads (rectus femoris region)
 * - "levator scapulae"   -> traps (upper trapezius region)
 * - "upper back"/"rhomboids" -> lats (single upper-back shape in the base asset)
 *
 * Unmapped (no sensible region, atlas simply skips them):
 * "cardiovascular system", "ankles", "feet", "hands", "wrists", "shins",
 * "ankle stabilizers", "sternocleidomastoid", "neck".
 */
const MUSCLE_TO_REGION: Record<string, AtlasRegionId> = {
  // chest
  pectorals: "pectorals",
  chest: "pectorals",
  "upper chest": "pectorals",
  // shoulders
  delts: "delts",
  deltoids: "delts",
  shoulders: "delts",
  "rear deltoids": "delts",
  "rotator cuff": "delts",
  // arms
  biceps: "biceps",
  brachialis: "biceps",
  triceps: "triceps",
  forearms: "forearms",
  "wrist flexors": "forearms",
  "wrist extensors": "forearms",
  "grip muscles": "forearms",
  // core
  abs: "abs",
  abdominals: "abs",
  core: "abs",
  "lower abs": "abs",
  obliques: "obliques",
  "serratus anterior": "obliques",
  // back
  lats: "lats",
  "latissimus dorsi": "lats",
  "upper back": "lats",
  rhomboids: "lats",
  back: "lats",
  traps: "traps",
  trapezius: "traps",
  "levator scapulae": "traps",
  "lower back": "lower-back",
  spine: "lower-back",
  // hips + legs
  glutes: "glutes",
  abductors: "glutes",
  quads: "quads",
  quadriceps: "quads",
  "hip flexors": "quads",
  hamstrings: "hamstrings",
  adductors: "adductors",
  "inner thighs": "adductors",
  groin: "adductors",
  calves: "calves",
  soleus: "calves",
};

/** Resolve a dataset muscle name to an atlas region, or null if unmapped. */
export function resolveRegion(muscle: string): AtlasRegionId | null {
  return MUSCLE_TO_REGION[muscle.trim().toLowerCase()] ?? null;
}

/**
 * Regions counted as anterior for the view heuristic. Delts and forearms are
 * visible in both views but read best from the front (musclewiki convention).
 */
const ANTERIOR: ReadonlySet<AtlasRegionId> = new Set([
  "pectorals",
  "abs",
  "obliques",
  "biceps",
  "quads",
  "adductors",
  "forearms",
  "delts",
]);

function isVisible(region: AtlasRegionId, view: AtlasView): boolean {
  return ATLAS_REGIONS[region][view].length > 0;
}

/**
 * Pick the atlas view that shows the most highlighted muscle.
 *
 * Heuristic (documented for the modal): every resolved region votes for the
 * side where it is anatomically dominant — anterior regions (pecs, abs,
 * obliques, biceps, quads, adductors, forearms, delts) vote "front",
 * everything else (lats, traps, triceps, glutes, hamstrings, calves, lower
 * back) votes "back". Primary muscles count triple, so the exercise's target
 * always outvotes its assistance muscles. Ties go to "front". A vote is only
 * cast if the region actually has shapes in that view.
 */
export function pickAtlasView(primary: string[], secondary: string[] = []): AtlasView {
  let front = 0;
  let backScore = 0;
  const vote = (muscle: string, weight: number) => {
    const region = resolveRegion(muscle);
    if (!region) return;
    if (ANTERIOR.has(region) && isVisible(region, "front")) front += weight;
    else if (!ANTERIOR.has(region) && isVisible(region, "back")) backScore += weight;
  };
  for (const m of primary) vote(m, 3);
  for (const m of secondary) vote(m, 1);
  return backScore > front ? "back" : "front";
}

/** True when at least one of the given muscles resolves to a visible region in some view. */
export function hasAtlasRegion(muscles: string[]): boolean {
  return muscles.some((m) => {
    const region = resolveRegion(m);
    return region !== null && (isVisible(region, "front") || isVisible(region, "back"));
  });
}
