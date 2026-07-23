#!/usr/bin/env node
/**
 * mapping-stats.mjs — coverage statistics for the purchased media-pack mapping.
 *
 * Usage: node scripts/media-pack/mapping-stats.mjs [path/to/pack-mapping.json]
 *
 * Prints:
 *   - per-confidence counts (high/medium/low/unknown/not-exercise)
 *   - per-equipment breakdown
 *   - duplicate-exercise listing (same libraryId covered by 2+ videos)
 *   - wizard-catalog coverage (distinct wizard ids with at least one video)
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const mappingPath =
  process.argv[2] ?? path.join(here, "pack-mapping.json");

const raw = JSON.parse(readFileSync(mappingPath, "utf8"));
const rows = Array.isArray(raw) ? raw : raw.entries ?? raw.videos;
const meta = Array.isArray(raw) ? null : raw._meta;

const count = (fn) =>
  rows.reduce((acc, r) => {
    const k = fn(r) ?? "none";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

const pct = (n) => `${((n / rows.length) * 100).toFixed(1)}%`;

console.log(`Total entries: ${rows.length}`);
if (meta) console.log(`Method: ${meta.method} | Date: ${meta.date}`);

console.log("\n== Confidence ==");
for (const [k, v] of Object.entries(count((r) => r.confidence)).sort(
  (a, b) => b[1] - a[1],
)) {
  console.log(`  ${k.padEnd(14)} ${String(v).padStart(4)}  (${pct(v)})`);
}

console.log("\n== Equipment ==");
for (const [k, v] of Object.entries(count((r) => r.equipment)).sort(
  (a, b) => b[1] - a[1],
)) {
  console.log(`  ${k.padEnd(14)} ${String(v).padStart(4)}  (${pct(v)})`);
}

console.log("\n== Overlays ==");
console.log(`  hasFormGuide   ${rows.filter((r) => r.hasFormGuide).length}`);
console.log(`  hasMusclePct   ${rows.filter((r) => r.hasMusclePct).length}`);
console.log("\n== Brand ==");
for (const [k, v] of Object.entries(count((r) => r.brand))) {
  console.log(`  ${k.padEnd(14)} ${String(v).padStart(4)}`);
}

console.log("\n== Mapping coverage ==");
const withLib = rows.filter((r) => r.libraryId);
const withWiz = rows.filter((r) => r.wizardId);
console.log(`  libraryId set  ${withLib.length} (${pct(withLib.length)})`);
console.log(
  `  distinct library exercises ${new Set(withLib.map((r) => r.libraryId)).size}`,
);
console.log(`  wizardId set   ${withWiz.length} (${pct(withWiz.length)})`);
console.log(
  `  distinct wizard exercises  ${new Set(withWiz.map((r) => r.wizardId)).size}`,
);

console.log("\n== Duplicate library exercises (2+ videos) ==");
const byLib = new Map();
for (const r of withLib) {
  if (!byLib.has(r.libraryId)) byLib.set(r.libraryId, []);
  byLib.get(r.libraryId).push(r);
}
const dups = [...byLib.entries()].filter(([, v]) => v.length > 1);
for (const [id, v] of dups.sort((a, b) => b[1].length - a[1].length)) {
  console.log(
    `  ${id} x${v.length}  ${v[0].exerciseNameEn}  [${v
      .map((r) => r.file.match(/\((\d+)\)/)?.[1])
      .join(", ")}]`,
  );
}
if (dups.length === 0) console.log("  none");
