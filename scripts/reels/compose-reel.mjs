#!/usr/bin/env node
/**
 * compose-reel.mjs — Generate a 1080x1920 bilingual exercise Reel from the
 * JCV24 exercise library (public/data/exercise-library.json) and the exercise
 * MP4s hosted at https://media.jcv24fitness.com/videos-mp4/.
 *
 * Usage:
 *   node scripts/reels/compose-reel.mjs 0043                       # explicit exercise id
 *   node scripts/reels/compose-reel.mjs random --seed 2026-07-15   # deterministic daily pick
 *
 * Flags:
 *   --seed <str>     Seed for the deterministic "random" pick (default: today UTC yyyy-mm-dd)
 *   --mark-used      Append the picked id to scripts/reels/used-ids.json
 *   --out <dir>      Output directory (default: reels-out/ at repo root)
 *   --duration <s>   Override total duration in seconds
 *   --voice <l>      es | en | none  (default: es). "none" = the original silent reel.
 *   --subs / --no-subs   Burn synced subtitles (default: on whenever voice is on)
 *   --name <str>     Override the output basename (default: {date}-{id})
 *
 * Output: reels-out/{name}.mp4 + reels-out/{name}.txt (bilingual caption)
 *
 * VOICE-OVER: narration is synthesized locally at $0 (Piper by default, see
 * tts.mjs). Each narration segment is a separate wav, so its real duration is
 * measured with ffprobe — that is what times the burned-in subtitles, with no
 * paid word-timestamp API anywhere. Swap in a cloned voice later by setting
 * REELS_TTS_PROVIDER; nothing else in this file changes.
 *
 * NOTE ON MEDIA LICENSE: exercise videos are (c) Gymvisual. The owner's
 * Gymvisual license is still in progress — do NOT publish publicly until that
 * license is finalized. The caption template credits "Ejercicio: Gymvisual".
 *
 * Requires: Node 18+ (global fetch) and ffmpeg on PATH (or env FFMPEG).
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildAss, buildNarration } from "./narration.mjs";
import { synthesizeSegments } from "./tts.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const LIBRARY_PATH = join(REPO_ROOT, "public", "data", "exercise-library.json");
const USED_IDS_PATH = join(SCRIPT_DIR, "used-ids.json");
const FONT_PATH = join(SCRIPT_DIR, "assets", "BebasNeue-Regular.ttf");
const MEDIA_BASE = "https://media.jcv24fitness.com";
const FFMPEG = process.env.FFMPEG || "ffmpeg";

const GRAPHITE = "0x0a0a0a";
const CYAN = "0x22d3ee";

// ---------------------------------------------------------------- CLI args

function parseArgs(argv) {
  const args = {
    id: null, seed: null, markUsed: false, out: null, duration: null,
    voice: "es", subs: null, name: null,
  };
  const rest = [...argv];
  while (rest.length) {
    const a = rest.shift();
    if (a === "--seed") args.seed = rest.shift();
    else if (a === "--mark-used") args.markUsed = true;
    else if (a === "--out") args.out = rest.shift();
    else if (a === "--duration") args.duration = Number(rest.shift());
    else if (a === "--voice") args.voice = String(rest.shift() ?? "").toLowerCase();
    else if (a === "--subs") args.subs = true;
    else if (a === "--no-subs") args.subs = false;
    else if (a === "--name") args.name = rest.shift();
    else if (!a.startsWith("--") && !args.id) args.id = a;
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!args.id) args.id = "random";
  if (!args.seed) args.seed = new Date().toISOString().slice(0, 10);
  if (!["es", "en", "none"].includes(args.voice)) {
    throw new Error(`--voice must be es | en | none (got "${args.voice}")`);
  }
  // subtitles default: on with a voice, off without (there is nothing to sync to)
  if (args.subs === null) args.subs = args.voice !== "none";
  if (args.subs && args.voice === "none") {
    throw new Error("--subs requires a voice; subtitle timing comes from the narration audio");
  }
  return args;
}

// ------------------------------------------------- deterministic daily pick

/** FNV-1a 32-bit hash — stable across runs/platforms for the same seed. */
function fnv1a(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

function loadUsedIds() {
  if (!existsSync(USED_IDS_PATH)) return [];
  try {
    const parsed = JSON.parse(readFileSync(USED_IDS_PATH, "utf8"));
    return Array.isArray(parsed.used) ? parsed.used : [];
  } catch {
    return [];
  }
}

function pickExercise(library, args) {
  if (args.id !== "random") {
    const ex = library.find((e) => e.id === args.id);
    if (!ex) throw new Error(`Exercise id "${args.id}" not found in library`);
    return ex;
  }
  const used = new Set(loadUsedIds());
  let candidates = library.filter((e) => !used.has(e.id));
  if (candidates.length === 0) candidates = library; // full cycle done: start over
  candidates.sort((a, b) => a.id.localeCompare(b.id));
  const idx = fnv1a(args.seed) % candidates.length;
  return candidates[idx];
}

// ------------------------------------------------------ Spanish translation
// The library only carries English names; instructions are already bilingual.
// Best-effort gym-Spanish name: strip the leading equipment word, translate
// the movement phrase greedily (longest match first), re-attach equipment.

const EQUIPMENT_ES = {
  assisted: "asistido",
  band: "con banda",
  barbell: "con barra",
  "body weight": "peso corporal",
  "bosu ball": "con bosu",
  cable: "en polea",
  dumbbell: "con mancuernas",
  "elliptical machine": "en elíptica",
  "ez barbell": "con barra Z",
  hammer: "en máquina hammer",
  kettlebell: "con pesa rusa",
  "leverage machine": "en máquina",
  "medicine ball": "con balón medicinal",
  "olympic barbell": "con barra olímpica",
  "resistance band": "con banda elástica",
  roller: "con rueda",
  rope: "con cuerda",
  "skierg machine": "en máquina SkiErg",
  "sled machine": "en trineo",
  "smith machine": "en máquina Smith",
  "stability ball": "con balón de estabilidad",
  "stationary bike": "en bici estática",
  "stepmill machine": "en escaladora",
  tire: "con llanta",
  "trap bar": "con barra hexagonal",
  "upper body ergometer": "en ergómetro de brazos",
  weighted: "con peso",
  "wheel roller": "con rueda abdominal",
};

const TARGET_ES = {
  abductors: "abductores",
  abs: "abdominales",
  adductors: "aductores",
  biceps: "bíceps",
  calves: "pantorrillas",
  "cardiovascular system": "cardio",
  delts: "hombros",
  forearms: "antebrazos",
  glutes: "glúteos",
  hamstrings: "isquiotibiales",
  lats: "dorsales",
  "levator scapulae": "cuello y trapecio",
  pectorals: "pecho",
  quads: "cuádriceps",
  "serratus anterior": "serrato",
  spine: "core y columna",
  traps: "trapecios",
  triceps: "tríceps",
  "upper back": "espalda alta",
};

// Leading tokens in exercise names that describe equipment, mapped to a
// Spanish suffix. Ordered longest-first so "ez barbell" wins over "barbell".
const NAME_EQUIPMENT_PREFIXES = [
  ["olympic barbell", "con barra olímpica"],
  ["ez barbell", "con barra Z"],
  ["trap bar", "con barra hexagonal"],
  ["smith", "en máquina Smith"],
  ["barbell", "con barra"],
  ["dumbbell", "con mancuernas"],
  ["cable", "en polea"],
  ["lever", "en máquina"],
  ["kettlebell", "con pesa rusa"],
  ["resistance band", "con banda elástica"],
  ["band", "con banda"],
  ["weighted", "con peso"],
  ["assisted", "asistido"],
  ["suspension", "en suspensión"],
  ["medicine ball", "con balón medicinal"],
  ["stability ball", "con balón"],
  ["exercise ball", "con balón"],
  ["bodyweight", ""],
];

// Movement phrases, longest-first greedy replacement. Gym Spanish keeps many
// anglicisms (curl, press, hip thrust) on purpose.
const PHRASE_ES = [
  ["romanian deadlift", "peso muerto rumano"],
  ["stiff leg deadlift", "peso muerto piernas rígidas"],
  ["straight leg deadlift", "peso muerto piernas rectas"],
  ["sumo deadlift", "peso muerto sumo"],
  ["deadlift", "peso muerto"],
  ["full squat", "sentadilla profunda"],
  ["front squat", "sentadilla frontal"],
  ["split squat", "sentadilla búlgara"],
  ["hack squat", "sentadilla hack"],
  ["jump squat", "sentadilla con salto"],
  ["squat", "sentadilla"],
  ["bench press", "press de banca"],
  ["shoulder press", "press de hombros"],
  ["military press", "press militar"],
  ["chest press", "press de pecho"],
  ["overhead press", "press sobre cabeza"],
  ["push up", "flexiones"],
  ["push-up", "flexiones"],
  ["pull up", "dominadas"],
  ["pull-up", "dominadas"],
  ["chin up", "dominadas supinas"],
  ["chin-up", "dominadas supinas"],
  ["lat pulldown", "jalón al pecho"],
  ["pulldown", "jalón"],
  ["pullover", "pullover"],
  ["bent over row", "remo inclinado"],
  ["upright row", "remo al mentón"],
  ["row", "remo"],
  ["preacher curl", "curl predicador"],
  ["hammer curl", "curl martillo"],
  ["concentration curl", "curl concentrado"],
  ["wrist curl", "curl de muñeca"],
  ["leg curl", "curl femoral"],
  ["biceps curl", "curl de biceps"],
  ["bicep curl", "curl de biceps"],
  ["curl", "curl"],
  ["triceps extension", "extensión de tríceps"],
  ["leg extension", "extensión de piernas"],
  ["back extension", "extensión lumbar"],
  ["extension", "extensión"],
  ["lateral raise", "elevaciones laterales"],
  ["front raise", "elevaciones frontales"],
  ["calf raise", "elevación de talones"],
  ["leg raise", "elevación de piernas"],
  ["raise", "elevaciones"],
  ["fly", "aperturas"],
  ["reverse fly", "aperturas inversas"],
  ["crunch", "crunch"],
  ["sit up", "abdominales"],
  ["sit-up", "abdominales"],
  ["lunge", "zancada"],
  ["shrug", "encogimientos"],
  ["dip", "fondos"],
  ["hip thrust", "hip thrust"],
  ["glute bridge", "puente de glúteos"],
  ["bridge", "puente"],
  ["plank", "plancha"],
  ["kickback", "patada trasera"],
  ["good morning", "buenos días"],
  ["stretch", "estiramiento"],
  ["twist", "giro"],
  ["step up", "subida al cajon"],
  ["step-up", "subida al cajon"],
  ["clean and press", "cargada y press"],
  ["clean", "cargada"],
  ["snatch", "arranque"],
  ["swing", "swing"],
  ["thruster", "thruster"],
  ["mountain climber", "escaladores"],
  ["burpee", "burpee"],
  ["jumping jack", "jumping jacks"],
  ["wall sit", "sentadilla isométrica"],
  ["toe touch", "toque de punta de pies"],
  ["side-to-side", "lado a lado"],
  ["side to side", "lado a lado"],
  ["rotation", "rotación"],
  ["circles", "círculos"],
  ["kick", "patada"],
  ["hold", "sostenido"],
  ["march", "marcha"],
  ["walk", "caminata"],
  ["run", "carrera"],
  ["sprint", "sprint"],
  ["hop", "salto corto"],
  ["jump", "salto"],
  ["skater", "patinador"],
  ["superman", "superman"],
  ["bird dog", "bird dog"],
  ["dead bug", "dead bug"],
  ["renegade", "renegado"],
  ["farmers walk", "caminata del granjero"],
  ["hyperextension", "hiperextensión"],
  ["press", "press"],
  // modifiers
  ["close grip", "agarre cerrado"],
  ["close-grip", "agarre cerrado"],
  ["wide grip", "agarre abierto"],
  ["wide-grip", "agarre abierto"],
  ["reverse grip", "agarre inverso"],
  ["one arm", "a un brazo"],
  ["one-arm", "a un brazo"],
  ["single arm", "a un brazo"],
  ["one leg", "a una pierna"],
  ["single leg", "a una pierna"],
  ["alternate", "alterno"],
  ["alternating", "alterno"],
  ["neutral", "agarre neutro"],
  ["incline", "inclinado"],
  ["decline", "declinado"],
  ["seated", "sentado"],
  ["standing", "de pie"],
  ["lying", "acostado"],
  ["kneeling", "de rodillas"],
  ["reverse", "inverso"],
  ["overhead", "sobre cabeza"],
  ["behind neck", "tras nuca"],
  ["rear", "posterior"],
  ["side", "lateral"],
  ["front", "frontal"],
  ["upper", "superior"],
  ["lower", "inferior"],
  ["high", "alto"],
  ["low", "bajo"],
  ["v.", ""],
];

function translateName(name) {
  // drop parentheticals: "(male)", "(on stability ball)" — equipment covers it
  let core = name.toLowerCase().replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
  let suffix = "";
  for (const [prefix, es] of NAME_EQUIPMENT_PREFIXES) {
    if (core === prefix || core.startsWith(prefix + " ")) {
      core = core.slice(prefix.length).trim();
      suffix = es;
      break;
    }
  }
  // greedy longest-match phrase translation
  const sorted = [...PHRASE_ES].sort((a, b) => b[0].length - a[0].length);
  for (const [en, es] of sorted) {
    const re = new RegExp(`(^|\\s)${en.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=\\s|$)`, "g");
    core = core.replace(re, (_, pre) => `${pre}${es}`);
  }
  core = core.replace(/\s+/g, " ").trim();
  // Spanish puts modifiers after the movement: "inclinado press de banca"
  // -> "press de banca inclinado". Rotate leading modifiers to the end.
  const TRAILING_MODIFIERS = [
    "lado a lado", "agarre cerrado", "agarre abierto", "agarre inverso",
    "a un brazo", "a una pierna", "sobre cabeza", "de rodillas", "de pie",
    "inclinado", "declinado", "sentado", "acostado", "inverso", "alterno",
    "lateral", "frontal", "posterior", "tras nuca", "agarre neutro",
  ];
  for (let moved = true, guard = 0; moved && guard < 3; guard++) {
    moved = false;
    for (const mod of TRAILING_MODIFIERS) {
      if (core.startsWith(mod + " ") && core.length > mod.length + 1) {
        core = `${core.slice(mod.length + 1)} ${mod}`;
        moved = true;
        break;
      }
    }
  }
  const full = suffix ? `${core} ${suffix}` : core;
  return full.trim() || name;
}

// ------------------------------------------------------------- text helpers

function wrapText(text, maxChars) {
  const words = text.split(/\s+/);
  const lines = [];
  let line = "";
  for (const w of words) {
    if (!line) line = w;
    else if ((line + " " + w).length <= maxChars) line += " " + w;
    else {
      lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** Escape a path for use as an ffmpeg filter option value. */
function escFilterPath(p) {
  return p.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/,/g, "\\,").replace(/'/g, "\\'");
}

// ------------------------------------------------------------------- main

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!existsSync(FONT_PATH)) {
    throw new Error(`Missing font ${FONT_PATH} — commit BebasNeue-Regular.ttf to scripts/reels/assets/`);
  }
  const library = JSON.parse(readFileSync(LIBRARY_PATH, "utf8"));
  const ex = pickExercise(library, args);

  const date = args.seed && /^\d{4}-\d{2}-\d{2}$/.test(args.seed) ? args.seed : new Date().toISOString().slice(0, 10);
  const outDir = args.out ? resolve(args.out) : join(REPO_ROOT, "reels-out");
  const tmpDir = join(outDir, ".tmp");
  mkdirSync(tmpDir, { recursive: true });

  // -- download the exercise MP4 (base name comes from the gif field)
  const base = (ex.gif.split("/").pop() || "").replace(/\.gif$/i, "");
  const videoUrl = `${MEDIA_BASE}/videos-mp4/${base}.mp4`;
  const srcPath = join(tmpDir, `${base}.mp4`);
  if (!existsSync(srcPath)) {
    console.log(`Downloading ${videoUrl}`);
    const res = await fetch(videoUrl);
    if (!res.ok) throw new Error(`Failed to download ${videoUrl}: HTTP ${res.status}`);
    writeFileSync(srcPath, Buffer.from(await res.arrayBuffer()));
  }

  // -- texts
  const nameEs = translateName(ex.name).toUpperCase();
  const nameEn = ex.name.replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim().toUpperCase();
  const stepsEs = (ex.instruction_steps?.es ?? []).slice(0, 3);
  if (stepsEs.length === 0) throw new Error(`Exercise ${ex.id} has no Spanish instruction steps`);
  const nSteps = stepsEs.length;
  const targetEs = TARGET_ES[ex.target] ?? ex.target;

  // The reel's primary (big, white) title follows the narration language; the
  // other language stays as the small cyan subtitle. --voice none keeps the
  // original ES-primary layout.
  const primaryLang = args.voice === "en" ? "en" : "es";
  const titlePrimary = primaryLang === "en" ? nameEn : nameEs;
  const titleSecondary = primaryLang === "en" ? nameEs : nameEn;

  // -- voice-over: synthesize each narration segment separately so ffprobe can
  //    give us a real per-segment duration to time the subtitles with.
  let narration = null;
  if (args.voice !== "none") {
    const lang = args.voice;
    const script = buildNarration({
      lang,
      name: lang === "en" ? titleCase(ex.name) : titleCase(translateName(ex.name)),
      muscle: lang === "en" ? ex.target : targetEs,
      steps: ex.instruction_steps?.[lang] ?? [],
    });
    if (!script.length) throw new Error(`Exercise ${ex.id} has no ${lang} instruction steps for narration`);
    narration = synthesizeSegments({ segments: script, lang, dir: join(tmpDir, "voice") });
    const s0 = narration.segments[0];
    console.log(
      `Narration: ${narration.segments.length} segments, ${narration.total.toFixed(1)}s ` +
        `(${s0.provider}/${s0.voice}${narration.segments.every((s) => s.cached) ? ", cached" : ""})`
    );
  }

  // -- timing. Silent reel: the original ~4s-per-step 10-15s window.
  //    Voiced reel: the audio decides, so we never clip the narration.
  const VOICE_TAIL = 1.0;
  const duration = args.duration
    ? Math.max(5, args.duration)
    : narration
      ? Math.min(60, narration.total + VOICE_TAIL)
      : Math.min(15, Math.max(10, 1.2 + nSteps * 3.9 + 0.6));
  const captionStart = 1.2;
  const seg = (duration - captionStart - 0.6) / nSteps;

  // -- layout (1080x1920)
  // fit the primary title in max 2 lines: widen the wrap (and shrink the font)
  // until it fits instead of truncating words
  let titleLines = wrapText(titlePrimary, 24);
  for (const width of [32, 40, 52]) {
    if (titleLines.length <= 2) break;
    titleLines = wrapText(titlePrimary, width);
  }
  titleLines = titleLines.slice(0, 2);
  const titleMaxLen = Math.max(...titleLines.map((l) => l.length));
  const titleSize = Math.max(56, Math.min(100, Math.floor(2040 / Math.max(titleMaxLen, 12))));
  const titleY = 150;
  const titleBlockH = titleLines.length * titleSize + (titleLines.length - 1) * 10;
  const enSize = Math.max(30, Math.min(44, Math.floor(1900 / Math.max(titleSecondary.length, 14))));
  const enY = titleY + titleBlockH + 26;
  const videoY = 460;
  const videoX = 90;
  const videoSize = 900;
  const capLabelY = 1408;
  const capTextY = 1470;
  const watermarkY = 1790;
  const creditY = 1852;

  // -- write textfiles (avoids drawtext escaping issues entirely)
  const tf = (name, content) => {
    const p = join(tmpDir, name);
    writeFileSync(p, content, "utf8");
    return escFilterPath(p);
  };
  const titleEnFile = tf("title-secondary.txt", titleSecondary);
  const watermarkFile = tf("watermark.txt", "@jcv_24 — jcv24fitness.com");
  const creditFile = tf("credit.txt", "Video: Gymvisual (c)");

  const font = escFilterPath(FONT_PATH);
  const filters = [];

  // exercise video: upscale onto a white square card
  filters.push(
    `[1:v]fps=30,scale=${videoSize}:${videoSize}:flags=lanczos:force_original_aspect_ratio=decrease,` +
      `pad=${videoSize}:${videoSize}:(ow-iw)/2:(oh-ih)/2:color=white,setsar=1[ex]`
  );
  const chain = [
    `overlay=${videoX}:${videoY}:shortest=0`,
    // cyan frame around the video card
    `drawbox=x=${videoX - 6}:y=${videoY - 6}:w=${videoSize + 12}:h=${videoSize + 12}:color=${CYAN}:t=6`,
    // top accent bar
    `drawbox=x=490:y=112:w=100:h=10:color=${CYAN}:t=fill`,
    // primary title (big, white) — one drawtext per line so every line is centered
    ...titleLines.map(
      (line, i) =>
        `drawtext=fontfile=${font}:textfile=${tf(`title-primary-${i}.txt`, line)}:fontcolor=white:fontsize=${titleSize}:x=(w-text_w)/2:y=${titleY + i * (titleSize + 10)}`
    ),
    // secondary title (small, cyan)
    `drawtext=fontfile=${font}:textfile=${titleEnFile}:fontcolor=${CYAN}:fontsize=${enSize}:x=(w-text_w)/2:y=${enY}`,
  ];

  // Sequential ES instruction captions — ONLY on the silent/subtitle-less reel.
  // With subtitles on they are switched off entirely: the burned .ass occupies
  // the same lower third, so keeping both would overlap.
  if (!args.subs) {
    stepsEs.forEach((step, i) => {
      const start = (captionStart + i * seg).toFixed(2);
      const end = (captionStart + (i + 1) * seg).toFixed(2);
      let size = 44;
      let lines = wrapText(step, 46);
      if (lines.length > 4) {
        size = 38;
        lines = wrapText(step, 54);
        if (lines.length > 5) {
          lines = lines.slice(0, 5);
          lines[4] = lines[4].replace(/\s*\S*$/, " ...");
        }
      }
      const blockH = lines.length * Math.round(size * 1.25);
      const labelFile = tf(`step-label-${i}.txt`, `PASO ${i + 1}/${nSteps}`);
      const stepFile = tf(`step-${i}.txt`, lines.join("\n"));
      const enable = `enable='between(t,${start},${end})'`;
      chain.push(
        `drawbox=x=70:y=${capLabelY - 8}:w=10:h=${capTextY - capLabelY + blockH + 8}:color=${CYAN}:t=fill:${enable}`,
        `drawtext=fontfile=${font}:textfile=${labelFile}:fontcolor=${CYAN}:fontsize=40:x=110:y=${capLabelY}:${enable}`,
        `drawtext=fontfile=${font}:textfile=${stepFile}:fontcolor=white:fontsize=${size}:line_spacing=${Math.round(size * 0.25)}:x=110:y=${capTextY}:${enable}`
      );
    });
  }

  chain.push(
    `drawtext=fontfile=${font}:textfile=${watermarkFile}:fontcolor=white@0.9:fontsize=42:x=(w-text_w)/2:y=${watermarkY}`,
    `drawtext=fontfile=${font}:textfile=${creditFile}:fontcolor=white@0.45:fontsize=26:x=(w-text_w)/2:y=${creditY}`
  );

  // Burned-in subtitles, timed from the measured narration durations. Applied
  // last so it sits on top of everything, and anchored to the band between the
  // video card (ends y=1360) and the watermark (y=1790).
  let assPath = null;
  if (args.subs && narration) {
    assPath = join(tmpDir, `subs-${args.voice}.ass`);
    writeFileSync(assPath, buildAss({ segments: narration.segments, gap: narration.gap }), "utf8");
    chain.push(
      `subtitles=filename=${escFilterPath(assPath)}:fontsdir=${escFilterPath(join(SCRIPT_DIR, "assets"))}`
    );
  }

  filters.push(`[0:v][ex]${chain.join(",")}[out]`);

  // -- narration audio: one input per segment, delayed to its measured start
  //    and mixed down. amix with normalize=0 keeps per-segment loudness.
  const audioInputs = [];
  if (narration) {
    const first = 2; // inputs 0 = bg color, 1 = exercise video
    narration.segments.forEach((s) => audioInputs.push(s.file));
    const delayed = narration.segments.map((s, i) => {
      const ms = Math.round(s.start * 1000);
      return `[${first + i}:a]adelay=${ms}|${ms}[v${i}]`;
    });
    const mixIn = narration.segments.map((_, i) => `[v${i}]`).join("");
    filters.push(
      ...delayed,
      `${mixIn}amix=inputs=${narration.segments.length}:normalize=0:dropout_transition=0,` +
        // apad guarantees the audio is never shorter than the video; -t trims both
        `aresample=48000,apad[aout]`
    );
  }

  const outName = args.name || `${date}-${ex.id}`;
  const outVideo = join(outDir, `${outName}.mp4`);
  const ffArgs = [
    "-y",
    "-f", "lavfi", "-i", `color=c=${GRAPHITE}:s=1080x1920:r=30:d=${duration + 1}`,
    "-stream_loop", "-1", "-i", srcPath,
    ...audioInputs.flatMap((f) => ["-i", f]),
    "-filter_complex", filters.join(";"),
    "-map", "[out]",
    ...(narration ? ["-map", "[aout]", "-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2"] : []),
    "-t", String(duration),
    "-r", "30",
    "-pix_fmt", "yuv420p",
    "-c:v", "libx264",
    "-preset", "medium",
    "-crf", "21",
    "-movflags", "+faststart",
    outVideo,
  ];
  console.log(
    `Composing ${outVideo} (${duration.toFixed(1)}s, voice=${args.voice}, subs=${args.subs ? "on" : "off"})`
  );
  execFileSync(FFMPEG, ffArgs, { stdio: ["ignore", "inherit", "inherit"] });

  // -- bilingual caption file
  const equipEs = EQUIPMENT_ES[ex.equipment] ?? ex.equipment;
  const nums = ["1️⃣", "2️⃣", "3️⃣"];
  const hashtags = [
    "#jcv24fitness", "#fitnesscolombia", "#gymcolombia", "#entrenamiento",
    "#rutinadegym", "#fitness", "#gym", "#ejercicio", "#gymmotivation",
    "#vidafitness", "#reelsfitness", "#fitcolombia", "#entrenadorpersonal",
    `#${targetEs.normalize("NFD").replace(/\p{M}/gu, "").replace(/[^a-z0-9]/gi, "")}`,
  ];
  const caption = [
    `\u{1F525} ${titleCase(translateName(ex.name))} \u{1F4AA}`,
    ``,
    `\u{1F3AF} Músculo: ${targetEs} | \u{1F3CB}️ Equipo: ${equipEs}`,
    ``,
    ...stepsEs.map((s, i) => `${nums[i] ?? `${i + 1}.`} ${s}`),
    ``,
    `\u{1F4BE} Guarda este reel para tu próxima rutina`,
    `\u{1F4F2} Planes personalizados en jcv24fitness.com`,
    ``,
    `➖➖➖➖➖➖➖➖➖➖`,
    ``,
    `\u{1F1FA}\u{1F1F8} ${titleCase(nameEn.toLowerCase())}`,
    `\u{1F3AF} Target: ${ex.target} | Equipment: ${ex.equipment}`,
    `\u{1F4AA} Save this reel & get your custom plan at jcv24fitness.com`,
    ``,
    `\u{1F3A5} Ejercicio: Gymvisual`,
    ``,
    hashtags.join(" "),
  ].join("\n");
  const outCaption = join(outDir, `${outName}.txt`);
  writeFileSync(outCaption, caption, "utf8");

  // -- track used ids
  if (args.markUsed) {
    const used = loadUsedIds();
    if (!used.includes(ex.id)) used.push(ex.id);
    writeFileSync(USED_IDS_PATH, JSON.stringify({ used }, null, 2) + "\n", "utf8");
  }

  console.log(
    JSON.stringify({
      id: ex.id, name: ex.name, nameEs, video: outVideo, caption: outCaption,
      duration: Number(duration.toFixed(2)),
      voice: args.voice, subs: args.subs,
      tts: narration ? { provider: narration.segments[0].provider, voice: narration.segments[0].voice, segments: narration.segments.length } : null,
      subtitles: assPath,
    })
  );
}

function titleCase(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
