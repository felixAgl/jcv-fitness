#!/usr/bin/env node
/**
 * muscle-overlay.mjs — Render the JCV muscle atlas (front/back body map with
 * the exercise's primary/secondary muscles highlighted in cyan) to a
 * transparent PNG, sized for an ffmpeg overlay on a 1080x1920 reel.
 *
 * Body path data: scripts/reels/assets/muscle-atlas.json — derived from the
 * MIT-licensed react-native-body-highlighter (attribution inside the JSON,
 * regenerate with scripts/muscle-atlas/extract-atlas-data.mjs).
 *
 * CLI:
 *   node scripts/reels/muscle-overlay.mjs 0043 --out reels-out/muscles.png
 *   node scripts/reels/muscle-overlay.mjs 0043 --lang en --view back
 *
 * Flags:
 *   --out <file>    Output PNG (default: reels-out/{id}-muscles.png)
 *   --view <v>      front | back | auto (default: auto — see pickView)
 *   --lang <l>      es | en (default: es) — panel heading + muscle labels
 *   --width <px>    Output width (default: 1080)
 *
 * Also exports buildAtlasSvg / buildOverlaySvg / renderMuscleOverlay for
 * compose-reel.mjs (--muscle-map) and for the validation renders.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..", "..");
const ATLAS_PATH = join(SCRIPT_DIR, "assets", "muscle-atlas.json");
const FONT_PATH = join(SCRIPT_DIR, "assets", "BebasNeue-Regular.ttf");
const LIBRARY_PATH = join(REPO_ROOT, "public", "data", "exercise-library.json");

// Palette — hex twins of the app CSS variables (see MuscleAtlas.tsx).
const LINE = "#94a3b8";
const ACCENT = "#22d3ee";
const MASS = "#1a2029";

const atlas = JSON.parse(readFileSync(ATLAS_PATH, "utf8"));

// ------------------------------------------------- muscle vocabulary mapping
// Mirror of src/shared/components/MuscleAtlas/muscle-map.ts (documented there).

const MUSCLE_TO_REGION = {
  pectorals: "pectorals", chest: "pectorals", "upper chest": "pectorals",
  delts: "delts", deltoids: "delts", shoulders: "delts",
  "rear deltoids": "delts", "rotator cuff": "delts",
  biceps: "biceps", brachialis: "biceps",
  triceps: "triceps",
  forearms: "forearms", "wrist flexors": "forearms",
  "wrist extensors": "forearms", "grip muscles": "forearms",
  abs: "abs", abdominals: "abs", core: "abs", "lower abs": "abs",
  obliques: "obliques", "serratus anterior": "obliques",
  lats: "lats", "latissimus dorsi": "lats", "upper back": "lats",
  rhomboids: "lats", back: "lats",
  traps: "traps", trapezius: "traps", "levator scapulae": "traps",
  "lower back": "lower-back", spine: "lower-back",
  glutes: "glutes", abductors: "glutes",
  quads: "quads", quadriceps: "quads", "hip flexors": "quads",
  hamstrings: "hamstrings",
  adductors: "adductors", "inner thighs": "adductors", groin: "adductors",
  calves: "calves", soleus: "calves",
};

const ANTERIOR = new Set(["pectorals", "abs", "obliques", "biceps", "quads", "adductors", "forearms", "delts"]);

const REGION_LABELS = {
  pectorals: { es: "Pectorales", en: "Chest" },
  delts: { es: "Hombros", en: "Shoulders" },
  biceps: { es: "Bíceps", en: "Biceps" },
  triceps: { es: "Tríceps", en: "Triceps" },
  forearms: { es: "Antebrazos", en: "Forearms" },
  abs: { es: "Abdominales", en: "Abs" },
  obliques: { es: "Oblicuos", en: "Obliques" },
  lats: { es: "Dorsales", en: "Lats" },
  traps: { es: "Trapecios", en: "Traps" },
  "lower-back": { es: "Espalda baja", en: "Lower back" },
  glutes: { es: "Glúteos", en: "Glutes" },
  quads: { es: "Cuádriceps", en: "Quads" },
  hamstrings: { es: "Isquiotibiales", en: "Hamstrings" },
  adductors: { es: "Aductores", en: "Adductors" },
  calves: { es: "Pantorrillas", en: "Calves" },
};

export function resolveRegion(muscle) {
  return MUSCLE_TO_REGION[String(muscle).trim().toLowerCase()] ?? null;
}

/** Same heuristic as pickAtlasView in muscle-map.ts: weighted anterior/posterior vote (primary x3). */
export function pickView(primary, secondary = []) {
  let front = 0;
  let back = 0;
  const vote = (muscle, weight) => {
    const region = resolveRegion(muscle);
    if (!region) return;
    const shapes = atlas.regions[region];
    if (ANTERIOR.has(region) && shapes.front.length > 0) front += weight;
    else if (!ANTERIOR.has(region) && shapes.back.length > 0) back += weight;
  };
  for (const m of primary) vote(m, 3);
  for (const m of secondary) vote(m, 1);
  return back > front ? "back" : "front";
}

function resolveEmphasis(primary, secondary) {
  const emphasis = {};
  for (const m of secondary) {
    const region = resolveRegion(m);
    if (region && !(region in emphasis)) emphasis[region] = "secondary";
  }
  for (const m of primary) {
    const region = resolveRegion(m);
    if (region) emphasis[region] = "primary";
  }
  return emphasis;
}

// --------------------------------------------------------------- SVG builders

/**
 * Inner markup of one body figure (no <svg> wrapper). Mirrors MuscleAtlas.tsx
 * exactly: mass fill, faint structural shapes, muscle fills, crisp contour.
 */
function figureContent(view, emphasis) {
  const parts = [];
  parts.push(`<path d="${atlas.outline[view]}" fill="${MASS}"/>`);
  for (const d of atlas.base[view]) {
    parts.push(`<path d="${d}" fill="${LINE}" fill-opacity="0.1"/>`);
  }
  for (const [region, shapes] of Object.entries(atlas.regions)) {
    const paths = shapes[view];
    if (paths.length === 0) continue;
    const state = emphasis[region];
    const fill = state ? ACCENT : LINE;
    const opacity = state === "primary" ? 1 : state === "secondary" ? 0.35 : 0.14;
    parts.push(
      `<g fill="${fill}" fill-opacity="${opacity}">` +
        paths.map((d) => `<path d="${d}"/>`).join("") +
        `</g>`
    );
  }
  parts.push(
    `<path d="${atlas.outline[view]}" fill="none" stroke="${LINE}" stroke-opacity="0.45" ` +
      `stroke-width="2" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`
  );
  return parts.join("\n");
}

/** Standalone atlas SVG (one figure), same visuals as the React component. */
export function buildAtlasSvg({ view, primary = [], secondary = [] }) {
  const emphasis = resolveEmphasis(primary, secondary);
  return (
    `<svg viewBox="${atlas.viewBox[view]}" xmlns="http://www.w3.org/2000/svg">` +
    figureContent(view, emphasis) +
    `</svg>`
  );
}

/** Translate a figure into an arbitrary box inside a larger SVG. */
function placedFigure(view, emphasis, x, y, height) {
  const scale = height / 1448;
  const offsetX = view === "back" ? 724 * scale : 0;
  return (
    `<g transform="translate(${(x - offsetX).toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)})">` +
    figureContent(view, emphasis) +
    `</g>`
  );
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const regionsCount = (emphasis) => Object.keys(emphasis).length;

/**
 * 1080x640 transparent overlay for the reel's top third: graphite panel with
 * a cyan edge, the auto-picked body view highlighted, heading and the list of
 * worked muscles (primary solid cyan dot, secondary dimmed).
 */
export function buildOverlaySvg({ primary, secondary = [], lang = "es", view = "auto", width = 1080 }) {
  const chosen = view === "auto" ? pickView(primary, secondary) : view;
  const emphasis = resolveEmphasis(primary, secondary);
  const height = Math.round((width * 640) / 1080);

  // panel geometry in the 1080x640 design space
  const panel = { x: 40, y: 24, w: 1000, h: 592, r: 24 };
  const figureH = 540;
  const figureW = (figureH * 724) / 1448; // 270
  const figureX = panel.x + 60;
  const figureY = panel.y + (panel.h - figureH) / 2;

  const heading = lang === "en" ? "MUSCLES WORKED" : "MÚSCULOS TRABAJADOS";
  const regions = Object.entries(emphasis)
    .sort(([, a], [, b]) => (a === b ? 0 : a === "primary" ? -1 : 1))
    .slice(0, 5);

  const textX = figureX + figureW + 70;
  // center the rows block between the heading baseline and the panel bottom
  const rowsTop = panel.y + 140;
  const rowsBottom = panel.y + panel.h - 40;
  const blockH = Math.min(regionsCount(emphasis), 5) * 76;
  let rowY = rowsTop + Math.max(0, (rowsBottom - rowsTop - blockH) / 2) + 50;
  const rows = regions
    .map(([region, state]) => {
      const label = REGION_LABELS[region]?.[lang] ?? region;
      const solid = state === "primary";
      const row =
        `<circle cx="${textX + 12}" cy="${rowY - 14}" r="10" fill="${ACCENT}" fill-opacity="${solid ? 1 : 0.35}"/>` +
        `<text x="${textX + 44}" y="${rowY}" font-family="Bebas Neue" font-size="52" ` +
        `fill="${solid ? "#ffffff" : "rgba(255,255,255,0.55)"}" letter-spacing="2">${esc(label.toUpperCase())}</text>`;
      rowY += 76;
      return row;
    })
    .join("\n");

  return `<svg width="${width}" height="${height}" viewBox="0 0 1080 640" xmlns="http://www.w3.org/2000/svg">
  <rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}" rx="${panel.r}" fill="#0d0f14"/>
  <rect x="${panel.x}" y="${panel.y}" width="${panel.w}" height="${panel.h}" rx="${panel.r}" fill="none" stroke="${ACCENT}" stroke-opacity="0.55" stroke-width="3"/>
  <rect x="${panel.x + 40}" y="${panel.y + 44}" width="76" height="8" fill="${ACCENT}"/>
  <text x="${textX}" y="${panel.y + 100}" font-family="Bebas Neue" font-size="64" fill="${ACCENT}" letter-spacing="3">${heading}</text>
  ${placedFigure(chosen, emphasis, figureX, figureY, figureH)}
  ${rows}
</svg>`;
}

/** Rasterize an SVG string to PNG via resvg (no browser, no puppeteer). */
export async function renderSvgToPng(svg, outPath, { width } = {}) {
  const { Resvg } = await import("@resvg/resvg-js");
  const resvg = new Resvg(svg, {
    ...(width ? { fitTo: { mode: "width", value: width } } : {}),
    font: {
      fontFiles: existsSync(FONT_PATH) ? [FONT_PATH] : [],
      loadSystemFonts: true,
      defaultFontFamily: "Bebas Neue",
    },
  });
  const png = resvg.render().asPng();
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, png);
  return outPath;
}

/**
 * Render the overlay PNG for one exercise from the library. Returns the PNG
 * path plus the muscles/view actually used (compose-reel logs them).
 */
export async function renderMuscleOverlay({ exercise, outPath, lang = "es", view = "auto", width = 1080 }) {
  const primary = [exercise.target].filter(Boolean);
  const secondary = exercise.secondary_muscles ?? [];
  const chosen = view === "auto" ? pickView(primary, secondary) : view;
  const svg = buildOverlaySvg({ primary, secondary, lang, view: chosen, width });
  await renderSvgToPng(svg, outPath);
  return { path: outPath, view: chosen, primary, secondary };
}

// ------------------------------------------------------------------ CLI mode

const isCli = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isCli) {
  const argv = process.argv.slice(2);
  const args = { id: null, out: null, view: "auto", lang: "es", width: 1080 };
  while (argv.length) {
    const a = argv.shift();
    if (a === "--out") args.out = argv.shift();
    else if (a === "--view") args.view = argv.shift();
    else if (a === "--lang") args.lang = argv.shift();
    else if (a === "--width") args.width = Number(argv.shift());
    else if (!a.startsWith("--") && !args.id) args.id = a;
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!args.id) throw new Error("Usage: muscle-overlay.mjs <exerciseId> [--out f.png] [--view front|back|auto] [--lang es|en]");
  const library = JSON.parse(readFileSync(LIBRARY_PATH, "utf8"));
  const exercise = library.find((e) => e.id === args.id);
  if (!exercise) throw new Error(`Exercise id "${args.id}" not found in library`);
  const outPath = args.out
    ? resolve(args.out)
    : join(REPO_ROOT, "reels-out", `${args.id}-muscles.png`);
  renderMuscleOverlay({ exercise, outPath, lang: args.lang, view: args.view, width: args.width })
    .then((r) => console.log(JSON.stringify(r)))
    .catch((err) => {
      console.error(err.message || err);
      process.exit(1);
    });
}
