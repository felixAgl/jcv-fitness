#!/usr/bin/env node
/**
 * narration.mjs — turns a library exercise into a short coach-style voice-over
 * script, plus the .ass subtitle file that is burned into the reel.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * TWO TEXTS PER SEGMENT — this is deliberate, do not collapse them:
 *
 *   segment.speak  what the TTS reads.  KEEPS ACCENTS ("empújate", "glúteos").
 *                  Piper/Kokoro phonemize from the written form, so stripping
 *                  accents measurably degrades Spanish pronunciation.
 *
 *   segment.show   what is burned on screen. SPANISH WITHOUT ACCENTS, matching
 *                  the existing on-screen convention in compose-reel.mjs (the
 *                  Bebas Neue display face and the drawtext titles are all
 *                  unaccented). English is unchanged either way.
 *
 * They are produced from the same source string and only differ by the
 * `stripAccents` pass — never author them independently or they will drift.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The script is NOT a robotic read of all 8 library steps. It is:
 *   1. the exercise name (hook)
 *   2. 2-3 short technique cues, trimmed to one clause each
 *   3. a closing rep/set line + CTA
 */

const CYAN_ASS = "&H00EECD22&"; // #22d3ee in ASS BGR order

/** Spanish on-screen convention: no accents (see header). */
export function stripAccents(s) {
  return s.normalize("NFD").replace(/\p{M}/gu, "").normalize("NFC");
}

/**
 * Trim a long library step to a single spoken cue.
 * Cuts at a clause boundary (comma / "y" / "mientras") once past `soft` chars,
 * hard-stops at `hard`.
 */
function toCue(step, { soft = 46, hard = 86 } = {}) {
  let s = String(step).trim().replace(/\s+/g, " ").replace(/\.$/, "");
  if (s.length <= hard) return s;
  const parts = s.split(/,\s*/);
  let out = parts.shift() ?? s;
  while (parts.length && out.length < soft) out += `, ${parts.shift()}`;
  if (out.length > hard) {
    // no usable comma: cut on the last word boundary before `hard`
    out = out.slice(0, hard).replace(/\s+\S*$/, "");
  }
  return out.replace(/[,;:]$/, "");
}

/** Pick up to `n` distinct cue steps, skipping the boilerplate closing step. */
function pickCueSteps(steps, n, lang) {
  const isClosing = (s) =>
    lang === "es"
      ? /repite el n[uú]mero|repeticiones desead/i.test(s)
      : /repeat for the desired/i.test(s);
  const body = steps.filter((s) => s && !isClosing(s));
  if (body.length <= n) return body;
  // evenly spaced across the movement so we get setup -> bottom -> drive
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(body[Math.round((i * (body.length - 1)) / (n - 1))]);
  }
  return [...new Set(out)];
}

const COPY = {
  es: {
    intro: (name) => `${name}.`,
    target: (muscle) => `Trabaja ${muscle}.`,
    close: "Cuatro series de diez repeticiones. Guarda este reel.",
    cta: "Tu plan personalizado en jcv veinticuatro fitness punto com.",
    ctaShow: "Tu plan personalizado en jcv24fitness.com",
  },
  en: {
    intro: (name) => `${name}.`,
    target: (muscle) => `Targets your ${muscle}.`,
    close: "Four sets of ten reps. Save this reel.",
    cta: "Get your custom plan at jcv twenty four fitness dot com.",
    ctaShow: "Get your custom plan at jcv24fitness.com",
  },
};

/**
 * Build the narration script for one language.
 *
 * @param {object} o
 * @param {"es"|"en"} o.lang
 * @param {string} o.name    display name already in the target language
 * @param {string} o.muscle  target muscle already in the target language
 * @param {string[]} o.steps instruction_steps for that language
 * @param {number} [o.cues]  how many technique cues (default 3)
 * @returns {{speak:string, show:string, highlight?:string}[]}
 */
export function buildNarration({ lang, name, muscle, steps, cues = 3 }) {
  const t = COPY[lang] ?? COPY.en;
  const segs = [];

  const push = (speak, opts = {}) => {
    const show = opts.show ?? speak;
    segs.push({
      speak: speak.trim(),
      // Spanish loses its accents ONLY on the way to the screen (see header).
      show: (lang === "es" ? stripAccents(show) : show).trim(),
      highlight: opts.highlight ? (lang === "es" ? stripAccents(opts.highlight) : opts.highlight) : undefined,
    });
  };

  push(t.intro(name));
  if (muscle) push(t.target(muscle), { highlight: muscle });
  for (const step of pickCueSteps(steps, cues, lang)) push(toCue(step));
  push(t.close);
  push(t.cta, { show: t.ctaShow });

  return segs;
}

// ------------------------------------------------------------- ASS subtitles

function assTime(sec) {
  const s = Math.max(0, sec);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const rest = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${rest.toFixed(2).padStart(5, "0")}`;
}

/** Greedy wrap; ASS uses \N for a hard line break. */
function wrapAss(text, maxChars) {
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
  return lines.join("\\N");
}

/**
 * Build an .ass file from the MEASURED segment durations. No timestamp API is
 * involved — every start/end comes from ffprobe on the synthesized wav.
 *
 * Layout contract with compose-reel.mjs: bottom-anchored (Alignment=2) with
 * MarginV=270, so the block lives strictly inside the band between the video
 * card (ends y=1360) and the watermark (y=1790): a 1-line cue sits at y≈1650,
 * a 3-line cue starts at y≈1420. The per-step drawtext captions are switched
 * OFF when subtitles are on, so nothing can overlap.
 */
export function buildAss({ segments, gap = 0.28, fontName = "Bebas Neue", fontSize = 62, marginV = 270 }) {
  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    "PlayResX: 1080",
    "PlayResY: 1920",
    "WrapStyle: 2",
    "ScaledBorderAndShadow: yes",
    "YCbCr Matrix: TV.709",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    // White fill, black outline + soft shadow so it stays legible over the
    // graphite bg and over the white video card if it ever rides up.
    `Style: Reel,${fontName},${fontSize},&H00FFFFFF,&H00FFFFFF,&H00101010,&H80000000,0,0,0,0,100,100,1,0,1,4,2,2,90,90,${marginV},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];

  const events = segments.map((seg, i) => {
    const next = segments[i + 1];
    // hold the line through most of the silent gap so subs don't flicker
    const end = next ? Math.min(next.start - 0.06, seg.end + gap * 0.9) : seg.end + 0.6;
    // Wrap FIRST, then colourize: the {\c...} override tags are zero-width on
    // screen but would otherwise be counted as characters by the wrapper.
    let text = wrapAss(seg.show, 30);
    if (seg.highlight) {
      // brand-cyan the key word; \r returns to the style's colour
      const re = new RegExp(seg.highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      text = text.replace(re, (m) => `{\\c${CYAN_ASS}}${m}{\\r}`);
    }
    return `Dialogue: 0,${assTime(seg.start)},${assTime(end)},Reel,,0,0,0,,${text}`;
  });

  return [...header, ...events, ""].join("\n");
}
