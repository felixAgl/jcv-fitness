#!/usr/bin/env node
/**
 * extract-atlas-data.mjs — Regenerate the MuscleAtlas SVG path data from the
 * upstream MIT-licensed react-native-body-highlighter repository.
 *
 * Base asset: https://github.com/HichamELBSI/react-native-body-highlighter
 * License:    MIT (c) 2022 ELABBASSI Hicham — see the attribution header
 *             emitted into every generated file.
 * Pinned to commit 15df9e2dbc621450001960bed5a30e6a75357faa so re-runs are
 * reproducible even if upstream redraws the body.
 *
 * Outputs (both committed, both generated — do not hand-edit):
 *   src/shared/components/MuscleAtlas/atlas-data.ts   (typed, for the app)
 *   scripts/reels/assets/muscle-atlas.json            (for muscle-overlay.mjs)
 *
 * Usage: node scripts/muscle-atlas/extract-atlas-data.mjs
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");

const UPSTREAM = "HichamELBSI/react-native-body-highlighter";
const SHA = "15df9e2dbc621450001960bed5a30e6a75357faa";
const RAW = `https://raw.githubusercontent.com/${UPSTREAM}/${SHA}`;

const ATTRIBUTION = `Body + muscle path data derived from react-native-body-highlighter
(https://github.com/${UPSTREAM}, MIT (c) 2022 ELABBASSI Hicham),
commit ${SHA.slice(0, 12)}. Regenerate with scripts/muscle-atlas/extract-atlas-data.mjs.`;

/**
 * Upstream slug -> JCV region id, per view. A null value means the shape is
 * part of the body silhouette (head, hands...) but never highlightable.
 * Slugs absent from a view's map are dropped for that view.
 */
const SLUG_TO_REGION = {
  front: {
    chest: "pectorals",
    deltoids: "delts",
    biceps: "biceps",
    triceps: "triceps",
    forearm: "forearms",
    abs: "abs",
    obliques: "obliques",
    quadriceps: "quads",
    adductors: "adductors",
    calves: "calves",
    trapezius: "traps",
    // structural, never highlighted
    head: null,
    hair: null,
    neck: null,
    hands: null,
    feet: null,
    knees: null,
    ankles: null,
    tibialis: null,
  },
  back: {
    trapezius: "traps",
    deltoids: "delts",
    triceps: "triceps",
    forearm: "forearms",
    "upper-back": "lats",
    "lower-back": "lower-back",
    gluteal: "glutes",
    hamstring: "hamstrings",
    adductors: "adductors",
    calves: "calves",
    head: null,
    hair: null,
    neck: null,
    hands: null,
    feet: null,
    ankles: null,
  },
};

async function fetchText(path) {
  const res = await fetch(`${RAW}/${path}`);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: HTTP ${res.status}`);
  return res.text();
}

/** Evaluate an upstream data-only TS module and return its exported array. */
function evalBodyData(source, exportName) {
  const js = source
    .replace(/^import[^;]+;\s*/gm, "")
    .replace(new RegExp(`export const ${exportName}: BodyPart\\[\\] =`), "return");
  return new Function(js)();
}

/** Pull the front/back silhouette outline `d` strings out of the wrapper. */
function extractOutlines(wrapperSource) {
  const ds = [...wrapperSource.matchAll(/d="([^"]+)"/g)].map((m) => m[1]);
  if (ds.length !== 2) throw new Error(`Expected 2 outline paths, got ${ds.length}`);
  const [front, back] = ds;
  return { front, back };
}

function collectPaths(part) {
  const { left = [], right = [], common = [] } = part.path ?? {};
  return [...common, ...left, ...right];
}

function buildView(data, view) {
  const map = SLUG_TO_REGION[view];
  const regions = {};
  const base = [];
  const unmapped = [];
  for (const part of data) {
    if (!(part.slug in map)) {
      unmapped.push(part.slug);
      continue;
    }
    const region = map[part.slug];
    const paths = collectPaths(part);
    if (region === null) base.push(...paths);
    else regions[region] = [...(regions[region] ?? []), ...paths];
  }
  if (unmapped.length) {
    console.warn(`[${view}] upstream slugs without a mapping entry: ${unmapped.join(", ")}`);
  }
  return { regions, base };
}

async function main() {
  const [frontSrc, backSrc, wrapperSrc] = await Promise.all([
    fetchText("assets/bodyFront.ts"),
    fetchText("assets/bodyBack.ts"),
    fetchText("components/SvgMaleWrapper.tsx"),
  ]);

  const front = buildView(evalBodyData(frontSrc, "bodyFront"), "front");
  const back = buildView(evalBodyData(backSrc, "bodyBack"), "back");
  const outlines = extractOutlines(wrapperSrc);

  const regionIds = [...new Set([...Object.keys(front.regions), ...Object.keys(back.regions)])].sort();

  const atlas = {
    attribution: ATTRIBUTION.replace(/\n/g, " "),
    viewBox: { front: "0 0 724 1448", back: "724 0 724 1448" },
    outline: outlines,
    base: { front: front.base, back: back.base },
    regions: Object.fromEntries(
      regionIds.map((id) => [
        id,
        { front: front.regions[id] ?? [], back: back.regions[id] ?? [] },
      ])
    ),
  };

  // ---- scripts/reels/assets/muscle-atlas.json
  const jsonPath = join(REPO_ROOT, "scripts", "reels", "assets", "muscle-atlas.json");
  mkdirSync(dirname(jsonPath), { recursive: true });
  writeFileSync(jsonPath, JSON.stringify(atlas), "utf8");

  // ---- src/shared/components/MuscleAtlas/atlas-data.ts
  const union = regionIds.map((id) => `  | "${id}"`).join("\n");
  const ts = `/**
 * GENERATED FILE — do not edit by hand.
 *
 * ${ATTRIBUTION.split("\n").join("\n * ")}
 */

export type AtlasView = "front" | "back";

/** Highlightable muscle regions of the atlas. */
export type AtlasRegionId =
${union};

export interface AtlasRegion {
  front: string[];
  back: string[];
}

export const ATLAS_VIEWBOX: Record<AtlasView, string> = ${JSON.stringify(atlas.viewBox, null, 2)};

/** Full-body contour, stroked (not filled) behind the muscle shapes. */
export const ATLAS_OUTLINE: Record<AtlasView, string> = {
  front: ${JSON.stringify(outlines.front)},
  back: ${JSON.stringify(outlines.back)},
};

/** Structural body shapes (head, hands, feet...) that are never highlighted. */
export const ATLAS_BODY_BASE: Record<AtlasView, string[]> = ${JSON.stringify(atlas.base, null, 2)};

/** SVG path data per region and view. Empty array = region not visible in that view. */
export const ATLAS_REGIONS: Record<AtlasRegionId, AtlasRegion> = ${JSON.stringify(atlas.regions, null, 2)};
`;
  const tsPath = join(REPO_ROOT, "src", "shared", "components", "MuscleAtlas", "atlas-data.ts");
  mkdirSync(dirname(tsPath), { recursive: true });
  writeFileSync(tsPath, ts, "utf8");

  console.log(`Wrote ${tsPath}`);
  console.log(`Wrote ${jsonPath}`);
  console.log(`Regions: ${regionIds.join(", ")}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
