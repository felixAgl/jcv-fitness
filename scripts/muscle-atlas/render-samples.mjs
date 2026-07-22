#!/usr/bin/env node
/**
 * render-samples.mjs — Visual validation renders for the MuscleAtlas.
 *
 * Renders representative muscle combos (front + back) on the app's dark
 * background at 80px (modal size) and 400px (reel/PDF size), plus a single
 * showcase grid PNG. Look at the output with your own eyes before shipping
 * any change to the atlas data or styling.
 *
 * Usage: node scripts/muscle-atlas/render-samples.mjs [--out dir]
 * Default output: reels-out/atlas-samples/
 */

import { mkdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { buildAtlasSvg, pickView, renderSvgToPng } from "../reels/muscle-overlay.mjs";

const argv = process.argv.slice(2);
const outDir = resolve(argv[0] === "--out" && argv[1] ? argv[1] : "reels-out/atlas-samples");
mkdirSync(outDir, { recursive: true });

/** The combos the atlas must get right (owner-facing exercises). */
export const SAMPLES = [
  { name: "bench-press", view: "front", primary: ["pectorals"], secondary: ["delts", "triceps"] },
  { name: "squat", view: "front", primary: ["quads"], secondary: ["glutes", "calves"] },
  { name: "deadlift", view: "back", primary: ["lower back"], secondary: ["hamstrings", "glutes"] },
  { name: "pullup", view: "back", primary: ["lats"], secondary: ["biceps", "upper back"] },
  { name: "plain-front", view: "front", primary: [], secondary: [] },
  { name: "plain-back", view: "back", primary: [], secondary: [] },
];

/** Render one combo at a given figure height on the app's page background. */
async function renderSample(sample, sizePx) {
  const svg = buildAtlasSvg(sample);
  const figW = Math.round(sizePx * (724 / 1448));
  const wrapped =
    `<svg width="${figW + 16}" height="${sizePx + 16}" viewBox="0 0 ${figW + 16} ${sizePx + 16}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="100%" height="100%" fill="#111827"/>` +
    `<svg x="8" y="8" width="${figW}" height="${sizePx}" viewBox="${svg.match(/viewBox="([^"]+)"/)[1]}">` +
    svg.replace(/^<svg [^>]+>/, "").replace(/<\/svg>$/, "") +
    `</svg></svg>`;
  const out = join(outDir, `${sample.name}-${sizePx}.png`);
  await renderSvgToPng(wrapped, out);
  return out;
}

async function renderGrid() {
  const cell = { w: 240, h: 470 };
  const cols = SAMPLES.length;
  const W = cols * cell.w;
  const H = cell.h + 60;
  const cells = SAMPLES.map((s, i) => {
    const svg = buildAtlasSvg(s);
    const vb = svg.match(/viewBox="([^"]+)"/)[1];
    const inner = svg.replace(/^<svg [^>]+>/, "").replace(/<\/svg>$/, "");
    const figH = 400;
    const figW = Math.round(figH * (724 / 1448));
    const x = i * cell.w + (cell.w - figW) / 2;
    return (
      `<svg x="${x}" y="30" width="${figW}" height="${figH}" viewBox="${vb}">${inner}</svg>` +
      `<text x="${i * cell.w + cell.w / 2}" y="${figH + 78}" text-anchor="middle" font-family="Bebas Neue" ` +
      `font-size="30" fill="#94a3b8" letter-spacing="2">${s.name.toUpperCase().replace(/-/g, " ")}</text>`
    );
  }).join("\n");
  const svg =
    `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">` +
    `<rect width="100%" height="100%" fill="#111827"/>${cells}</svg>`;
  const out = join(outDir, "showcase-grid.png");
  await renderSvgToPng(svg, out);
  return out;
}

const outputs = [];
for (const sample of SAMPLES) {
  outputs.push(await renderSample(sample, 80));
  outputs.push(await renderSample(sample, 400));
  const auto = pickView(sample.primary, sample.secondary);
  if (sample.primary.length && auto !== sample.view) {
    console.warn(`NOTE: auto view for ${sample.name} = ${auto}, sample forces ${sample.view}`);
  }
}
outputs.push(await renderGrid());
console.log(outputs.join("\n"));
