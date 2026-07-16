#!/usr/bin/env node
/**
 * Generates the PWA icons (public/icons/*.png) from inline SVG sources.
 *
 * No new npm dependencies (sharp is not installed): the SVGs are rasterized
 * with macOS Quick Look (`qlmanage -t`), which renders SVG natively and
 * outputs exact-size RGBA PNGs. (The homebrew ffmpeg was evaluated first but
 * its build ships the svg_pipe demuxer without an SVG *decoder*, so it cannot
 * rasterize.) macOS-only, but this is a checked-in-output script: the PNGs in
 * public/icons/ are committed, so CI/builds never need to run it.
 *
 * Design: cyan "JCV" wordmark + red base bar (matches public/favicon.svg) on
 * graphite (#0a0a0a). The maskable variant is full-bleed with the wordmark
 * inside the ~80% safe zone so launchers can crop it into any shape.
 *
 * Usage: node scripts/generate-pwa-icons.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "public", "icons");
mkdirSync(outDir, { recursive: true });

/** Base 512x512 SVG. `maskable` = full-bleed background, safe-zone content. */
function iconSvg({ maskable }) {
  // Regular icon: rounded-square graphite tile. Maskable: square full bleed.
  const rx = maskable ? 0 : 96;
  // Maskable safe zone is the inner 80%: scale the artwork down around center.
  const scale = maskable ? 0.78 : 1;
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" rx="${rx}" fill="#0a0a0a"/>
  <g transform="translate(256 256) scale(${scale}) translate(-256 -256)">
    <text x="256" y="288" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="170" letter-spacing="4" fill="#22D3EE">JCV</text>
    <rect x="116" y="336" width="280" height="26" rx="4" fill="#EF4444"/>
    <text x="256" y="418" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="bold" font-size="52" letter-spacing="18" fill="#9CA3AF">24</text>
  </g>
</svg>`;
}

/** Rasterize svgPath -> pngPath at size px using Quick Look. */
function rasterize(svgPath, pngPath, size, tmp) {
  execFileSync("/usr/bin/qlmanage", ["-t", "-s", String(size), "-o", tmp, svgPath], {
    stdio: "ignore",
  });
  const qlOut = join(tmp, `${basename(svgPath)}.png`);
  if (!existsSync(qlOut)) throw new Error(`qlmanage produced no output for ${svgPath}`);
  copyFileSync(qlOut, pngPath);
  rmSync(qlOut);
}

const tmp = mkdtempSync(join(tmpdir(), "jcv-icons-"));
try {
  const regularSvg = join(tmp, "icon.svg");
  const maskableSvg = join(tmp, "icon-maskable.svg");
  writeFileSync(regularSvg, iconSvg({ maskable: false }));
  writeFileSync(maskableSvg, iconSvg({ maskable: true }));

  rasterize(regularSvg, join(outDir, "icon-192.png"), 192, tmp);
  rasterize(regularSvg, join(outDir, "icon-512.png"), 512, tmp);
  rasterize(maskableSvg, join(outDir, "icon-maskable-512.png"), 512, tmp);
  console.log("PWA icons written to public/icons/");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
