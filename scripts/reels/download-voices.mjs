#!/usr/bin/env node
/**
 * download-voices.mjs — fetch the Piper voice models used by the Reels
 * voice-over into scripts/reels/voices/ (gitignored; ~60 MB each, which is why
 * they are NOT committed).
 *
 * Voices come from huggingface.co/rhasspy/piper-voices — free, no account, no
 * API key. Both the model and its .json config are required.
 *
 *   npm run reels:voices          # both languages
 *   node scripts/reels/download-voices.mjs es
 *
 * CI caches this directory keyed on VOICES below, so a run normally downloads
 * nothing. Adding a voice here invalidates the cache automatically.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { VOICES_DIR } from "./tts.mjs";

/** name -> repo path. Keep in sync with DEFAULT_PIPER_VOICES in tts.mjs. */
export const VOICES = {
  "es_MX-claude-high": "es/es_MX/claude/high",
  "es_ES-davefx-medium": "es/es_ES/davefx/medium",
  "en_US-ryan-medium": "en/en_US/ryan/medium",
};

const BASE = "https://huggingface.co/rhasspy/piper-voices/resolve/main";

/** Stable id for the current voice set — used as the CI cache key suffix. */
export function voicesHash() {
  return createHash("sha1").update(Object.keys(VOICES).sort().join(",")).digest("hex").slice(0, 12);
}

async function fetchTo(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} -> HTTP ${res.status}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const only = process.argv[2]; // optional "es" / "en" language filter
  mkdirSync(VOICES_DIR, { recursive: true });
  for (const [name, path] of Object.entries(VOICES)) {
    if (only && !name.startsWith(only)) continue;
    for (const ext of [".onnx", ".onnx.json"]) {
      const dest = join(VOICES_DIR, name + ext);
      if (existsSync(dest) && statSync(dest).size > 0) {
        console.log(`ok   ${name}${ext}`);
        continue;
      }
      console.log(`get  ${name}${ext}`);
      await fetchTo(`${BASE}/${path}/${name}${ext}`, dest);
    }
  }
  console.log(`Voices in ${VOICES_DIR} (hash ${voicesHash()})`);
}

if (process.argv[1]?.endsWith("download-voices.mjs")) {
  main().catch((e) => {
    console.error(e.message || e);
    process.exit(1);
  });
}
