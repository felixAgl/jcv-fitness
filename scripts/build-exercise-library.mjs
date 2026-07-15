#!/usr/bin/env node
/**
 * build-exercise-library.mjs
 *
 * Slims the hasaneyldrm/exercises-dataset into public/data/exercise-library.json
 * for the exercise library feature (src/features/exercises).
 *
 * Kept per exercise: id, name, category, body_part, equipment, target,
 * secondary_muscles (max 3), instructions ({es, en}),
 * instruction_steps ({es, en}), image path, gif path.
 * Media paths are RELATIVE to the dataset repo root — the base URL lives in
 * src/features/exercises/services/exercise-library.ts (getMediaUrls).
 *
 * Re-run with:
 *   node scripts/build-exercise-library.mjs <path-to-exercises.json>
 *
 * <path-to-exercises.json> is the full dataset from
 * https://github.com/hasaneyldrm/exercises-dataset (exercises.json, ~15MB).
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const datasetPath = process.argv[2];
if (!datasetPath) {
  console.error(
    "Usage: node scripts/build-exercise-library.mjs <path-to-exercises.json>"
  );
  process.exit(1);
}

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(projectRoot, "public", "data", "exercise-library.json");

const raw = JSON.parse(readFileSync(datasetPath, "utf8"));
if (!Array.isArray(raw)) {
  console.error("Expected the dataset to be a JSON array of exercises.");
  process.exit(1);
}

const slim = raw.map((ex) => ({
  id: ex.id,
  name: ex.name,
  category: ex.category,
  body_part: ex.body_part,
  equipment: ex.equipment,
  target: ex.target,
  secondary_muscles: (ex.secondary_muscles ?? []).slice(0, 3),
  instructions: { es: ex.instructions?.es ?? "", en: ex.instructions?.en ?? "" },
  instruction_steps: { es: ex.instruction_steps?.es ?? [], en: ex.instruction_steps?.en ?? [] },
  image: ex.image,
  gif: ex.gif_url,
}));

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(slim));

const bytes = Buffer.byteLength(JSON.stringify(slim));
const uniq = (key) => [...new Set(slim.map((e) => e[key]))].sort();

console.log(`Wrote ${outPath}`);
console.log(`Entries: ${slim.length}`);
console.log(`Size: ${(bytes / 1024 / 1024).toFixed(2)} MB (${bytes} bytes)`);
console.log(`Categories (${uniq("category").length}):`, uniq("category").join(", "));
console.log(`Equipment (${uniq("equipment").length}):`, uniq("equipment").join(", "));
console.log(`Targets (${uniq("target").length}):`, uniq("target").join(", "));
