#!/usr/bin/env node
/**
 * curation-stats.mjs — human-curation coverage for the purchased media-pack.
 *
 * Reads pack-curated.json / pack-rejected.json (produced by the manual
 * frame-by-frame review pass — see PR that added them) and prints:
 *   - accepted vs rejected counts + yield against the 122 "qualifying"
 *     candidates (wizardId set + confidence high/medium + old brand:"none")
 *   - accepted exercises (wizardId + libraryId)
 *   - rejection reason breakdown (bucketed by keyword) so future re-review
 *     passes can see where the pack falls down
 *
 * Usage: node scripts/media-pack/curation-stats.mjs
 */

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const curatedPath = path.join(here, "pack-curated.json");
const rejectedPath = path.join(here, "pack-rejected.json");

const curated = JSON.parse(readFileSync(curatedPath, "utf8"));
const rejected = JSON.parse(readFileSync(rejectedPath, "utf8"));
const total = curated.length + rejected.length;

console.log(`Reviewed: ${total} candidates (wizardId + confidence high/medium + brand:"none")`);
console.log(`  Accepted: ${curated.length} (${((curated.length / total) * 100).toFixed(1)}%)`);
console.log(`  Rejected: ${rejected.length} (${((rejected.length / total) * 100).toFixed(1)}%)`);

console.log("\n== Accepted exercises ==");
for (const v of curated) {
  console.log(`  ${v.file}  wizardId=${v.wizardId}  libraryId=${v.libraryId}`);
}

const BUCKETS = [
  ["branded splash / logo", /branded|logo|you can|app store/i],
  ["checkmark/badge UI (screen-recording tell)", /checkmark|badge/i],
  ["wrong identity", /wrong identity/i],
  ["baked text overlay", /baked (english )?text/i],
  ["multi-exercise / compilation", /multi-exercise|compilation|montage/i],
  ["hidden watermark (found only on deep re-check)", /wordmark|full-resolution|full-bleed test composite/i],
];
const counts = Object.fromEntries(BUCKETS.map(([name]) => [name, 0]));
for (const v of rejected) {
  for (const [name, re] of BUCKETS) {
    if (re.test(v.reason)) counts[name]++;
  }
}
console.log("\n== Rejection reason breakdown (a video can match multiple buckets) ==");
for (const [name, n] of Object.entries(counts)) {
  console.log(`  ${name.padEnd(45)} ${n}`);
}
