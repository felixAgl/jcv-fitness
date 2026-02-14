// Video timing configuration @ 30fps
export const FPS = 30;
export const TOTAL_DURATION = 70; // seconds

export const SEQUENCES = {
  hook: { start: 0, end: 5 },
  problem: { start: 5, end: 12 },
  landing: { start: 12, end: 22 },
  wizard: { start: 22, end: 42 },
  pdf: { start: 42, end: 52 },
  dashboard: { start: 52, end: 62 },
  cta: { start: 62, end: 70 },
} as const;

export const toFrames = (seconds: number) => Math.round(seconds * FPS);
export const toDuration = (startSec: number, endSec: number) => toFrames(endSec - startSec);

export const FRAME_SEQUENCES = {
  hook: { from: toFrames(SEQUENCES.hook.start), durationInFrames: toDuration(SEQUENCES.hook.start, SEQUENCES.hook.end) },
  problem: { from: toFrames(SEQUENCES.problem.start), durationInFrames: toDuration(SEQUENCES.problem.start, SEQUENCES.problem.end) },
  landing: { from: toFrames(SEQUENCES.landing.start), durationInFrames: toDuration(SEQUENCES.landing.start, SEQUENCES.landing.end) },
  wizard: { from: toFrames(SEQUENCES.wizard.start), durationInFrames: toDuration(SEQUENCES.wizard.start, SEQUENCES.wizard.end) },
  pdf: { from: toFrames(SEQUENCES.pdf.start), durationInFrames: toDuration(SEQUENCES.pdf.start, SEQUENCES.pdf.end) },
  dashboard: { from: toFrames(SEQUENCES.dashboard.start), durationInFrames: toDuration(SEQUENCES.dashboard.start, SEQUENCES.dashboard.end) },
  cta: { from: toFrames(SEQUENCES.cta.start), durationInFrames: toDuration(SEQUENCES.cta.start, SEQUENCES.cta.end) },
} as const;

export const TOTAL_FRAMES = toFrames(TOTAL_DURATION);
