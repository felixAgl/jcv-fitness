#!/usr/bin/env node
/**
 * validate-pack.mjs — re-runnable validator for a purchased exercise media pack.
 *
 * Usage:
 *   node scripts/media-pack/validate-pack.mjs <extracted-dir> \
 *     [--out manifest.json] [--ffprobe /path/to/ffprobe] [--expected-count N]
 *
 * What it does:
 *   1. Walks <extracted-dir> recursively and inventories every file.
 *   2. Probes every gif/mp4 with ffprobe: width, height, duration.
 *      A non-zero ffprobe exit marks the file as corrupt.
 *   3. Detects dimension/duration outliers per media type.
 *   4. Writes a JSON manifest: { name, path, type, w, h, duration, size } per file
 *      plus summary counts, corrupt list, and outlier list.
 *
 * Exit codes: 0 = ok, 1 = usage/IO error, 2 = corrupt files found,
 *             3 = expected-count mismatch.
 *
 * Media files are never committed to the repo — only this script and its test.
 */

import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const MEDIA_TYPES = new Set(["gif", "mp4"]);

const TYPE_BY_EXT = {
  gif: "gif",
  mp4: "mp4",
  docx: "docx",
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
};

/** Classify a filename into a manifest type bucket. */
export function classifyType(name) {
  const ext = path.extname(name).slice(1).toLowerCase();
  return TYPE_BY_EXT[ext] ?? "other";
}

/** Counts by type + total size for a list of manifest file entries. */
export function summarize(files) {
  const byType = {};
  let totalSize = 0;
  for (const f of files) {
    byType[f.type] = (byType[f.type] ?? 0) + 1;
    totalSize += f.size ?? 0;
  }
  return { total: files.length, byType, totalSize };
}

function median(nums) {
  if (nums.length === 0) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Flag dimension/duration outliers per media type.
 * - duration outlier: > 4x or < 0.25x the per-type median duration.
 * - dimension outlier: resolution differs from the modal per-type resolution
 *   when the modal resolution covers >= 60% of that type's files.
 * Corrupt entries (no probe data) are excluded — they are reported separately.
 */
export function detectOutliers(files) {
  const outliers = [];
  for (const type of MEDIA_TYPES) {
    const group = files.filter(
      (f) => f.type === type && !f.corrupt && f.duration != null,
    );
    if (group.length < 3) continue;

    const med = median(group.map((f) => f.duration));
    const resCounts = {};
    for (const f of group) {
      const key = `${f.w}x${f.h}`;
      resCounts[key] = (resCounts[key] ?? 0) + 1;
    }
    const [modalRes, modalCount] = Object.entries(resCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];
    const modalDominant = modalCount / group.length >= 0.6;

    for (const f of group) {
      const reasons = [];
      if (med > 0 && (f.duration > med * 4 || f.duration < med * 0.25)) {
        reasons.push(`duration ${f.duration}s vs median ${med}s`);
      }
      if (modalDominant && `${f.w}x${f.h}` !== modalRes) {
        reasons.push(`resolution ${f.w}x${f.h} vs modal ${modalRes}`);
      }
      if (reasons.length > 0) {
        outliers.push({ path: f.path, type: f.type, reasons });
      }
    }
  }
  return outliers;
}

/** Schema check for a manifest object. Returns { valid, errors }. */
export function validateManifest(manifest) {
  const errors = [];
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

  if (!isObj(manifest)) return { valid: false, errors: ["manifest must be an object"] };
  if (typeof manifest.generatedAt !== "string") errors.push("generatedAt must be a string");
  if (typeof manifest.root !== "string") errors.push("root must be a string");
  if (!isObj(manifest.summary)) errors.push("summary must be an object");
  if (!Array.isArray(manifest.corrupt)) errors.push("corrupt must be an array");
  if (!Array.isArray(manifest.outliers)) errors.push("outliers must be an array");
  if (!Array.isArray(manifest.files)) {
    errors.push("files must be an array");
    return { valid: errors.length === 0, errors };
  }

  manifest.files.forEach((f, i) => {
    const where = `files[${i}]`;
    if (!isObj(f)) {
      errors.push(`${where} must be an object`);
      return;
    }
    if (typeof f.name !== "string" || f.name.length === 0) errors.push(`${where}.name must be a non-empty string`);
    if (typeof f.path !== "string" || f.path.length === 0) errors.push(`${where}.path must be a non-empty string`);
    if (typeof f.type !== "string") errors.push(`${where}.type must be a string`);
    if (typeof f.size !== "number" || f.size < 0) errors.push(`${where}.size must be a non-negative number`);
    const isMedia = MEDIA_TYPES.has(f.type);
    if (isMedia && !f.corrupt) {
      for (const k of ["w", "h"]) {
        if (typeof f[k] !== "number" || f[k] <= 0) errors.push(`${where}.${k} must be a positive number for non-corrupt media`);
      }
      // Some readable files (e.g. certain GIFs) expose no duration metadata.
      if (f.duration !== null && (typeof f.duration !== "number" || f.duration <= 0)) {
        errors.push(`${where}.duration must be a positive number or null for non-corrupt media`);
      }
    }
  });

  if (isObj(manifest.summary) && typeof manifest.summary.total === "number" && manifest.files) {
    if (manifest.summary.total !== manifest.files.length) {
      errors.push(`summary.total (${manifest.summary.total}) != files.length (${manifest.files.length})`);
    }
  }
  return { valid: errors.length === 0, errors };
}

async function walk(dir, out = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, out);
    else if (e.isFile() && !e.name.startsWith(".")) out.push(full);
  }
  return out;
}

function ffprobeFactory(ffprobeBin) {
  return (file) =>
    new Promise((resolve, reject) => {
      execFile(
        ffprobeBin,
        [
          "-v", "error",
          "-select_streams", "v:0",
          "-show_entries", "stream=width,height:format=duration",
          "-of", "json",
          file,
        ],
        { timeout: 30_000 },
        (err, stdout) => {
          if (err) return reject(err);
          try {
            const data = JSON.parse(stdout);
            const stream = data.streams?.[0] ?? {};
            const rawDuration = data.format?.duration != null ? Number(data.format.duration) : null;
            resolve({
              w: stream.width ?? null,
              h: stream.height ?? null,
              duration: Number.isFinite(rawDuration) && rawDuration > 0 ? rawDuration : null,
            });
          } catch (parseErr) {
            reject(parseErr);
          }
        },
      );
    });
}

/**
 * Build the manifest for an extracted pack directory.
 * `probe(file) -> Promise<{w,h,duration}>` is injectable for tests.
 */
export async function buildManifest(root, { probe, concurrency = 8 } = {}) {
  const absRoot = path.resolve(root);
  const paths = await walk(absRoot);
  const files = new Array(paths.length);

  let cursor = 0;
  async function worker() {
    while (cursor < paths.length) {
      const i = cursor++;
      const full = paths[i];
      const stat = await fs.stat(full);
      const entry = {
        name: path.basename(full),
        path: path.relative(absRoot, full),
        type: classifyType(full),
        size: stat.size,
        w: null,
        h: null,
        duration: null,
        corrupt: false,
      };
      if (MEDIA_TYPES.has(entry.type) && probe) {
        try {
          const meta = await probe(full);
          entry.w = meta.w;
          entry.h = meta.h;
          entry.duration = meta.duration;
          if (entry.w == null || entry.h == null) entry.corrupt = true;
        } catch {
          entry.corrupt = true;
        }
      }
      files[i] = entry;
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  const corrupt = files.filter((f) => f.corrupt).map((f) => f.path);
  return {
    generatedAt: new Date().toISOString(),
    root: absRoot,
    summary: summarize(files),
    corrupt,
    outliers: detectOutliers(files),
    files,
  };
}

function parseArgs(argv) {
  const args = { out: "media-pack-manifest.json", ffprobe: null, expectedCount: null, root: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--out") args.out = argv[++i];
    else if (a === "--ffprobe") args.ffprobe = argv[++i];
    else if (a === "--expected-count") args.expectedCount = Number(argv[++i]);
    else if (!a.startsWith("--") && !args.root) args.root = a;
  }
  return args;
}

async function resolveFfprobe(explicit) {
  const candidates = [
    explicit,
    "/opt/homebrew/opt/ffmpeg-full/bin/ffprobe",
    "/opt/homebrew/bin/ffprobe",
    "ffprobe",
  ].filter(Boolean);
  for (const c of candidates) {
    if (c === "ffprobe") return c; // let PATH resolution try
    try {
      await fs.access(c);
      return c;
    } catch {
      /* try next */
    }
  }
  return "ffprobe";
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.root) {
    console.error("Usage: node scripts/media-pack/validate-pack.mjs <extracted-dir> [--out manifest.json] [--ffprobe path] [--expected-count N]");
    process.exit(1);
  }

  const ffprobeBin = await resolveFfprobe(args.ffprobe);
  console.log(`Scanning ${args.root} (ffprobe: ${ffprobeBin}) ...`);
  const manifest = await buildManifest(args.root, { probe: ffprobeFactory(ffprobeBin) });

  const check = validateManifest(manifest);
  if (!check.valid) {
    console.error("Internal error: generated manifest failed schema validation:");
    for (const e of check.errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  await fs.writeFile(args.out, JSON.stringify(manifest, null, 2));

  const { summary } = manifest;
  console.log(`\nTotal files: ${summary.total}`);
  for (const [type, count] of Object.entries(summary.byType).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${type.padEnd(6)} ${count}`);
  }
  console.log(`Total size: ${(summary.totalSize / 1024 / 1024).toFixed(1)} MB`);
  console.log(`Corrupt media: ${manifest.corrupt.length}`);
  for (const p of manifest.corrupt.slice(0, 20)) console.log(`  CORRUPT ${p}`);
  console.log(`Outliers: ${manifest.outliers.length}`);
  for (const o of manifest.outliers.slice(0, 20)) console.log(`  OUTLIER ${o.path}: ${o.reasons.join("; ")}`);
  console.log(`Manifest written to ${args.out}`);

  if (args.expectedCount != null && summary.total !== args.expectedCount) {
    console.error(`FAIL: expected ${args.expectedCount} files, found ${summary.total}`);
    process.exit(3);
  }
  if (manifest.corrupt.length > 0) process.exit(2);
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
