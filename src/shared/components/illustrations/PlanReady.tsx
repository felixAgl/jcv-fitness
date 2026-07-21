import {
  ACCENT,
  BrokenArc,
  IllustrationSvg,
  STROKE_WIDTH,
  type IllustrationProps,
} from "./base";

/**
 * Done: the arc turns cyan (the only closed-state illustration) and the mark
 * inside is the V-notch rotated 180 degrees, so the check is the motif itself.
 */
export function PlanReady({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <circle cx={60} cy={60} r={50} stroke={ACCENT} strokeOpacity={0.15} strokeWidth={STROKE_WIDTH} />
      <BrokenArc state="closed" />
      <path d="M44 60L54 70L76 48" stroke={ACCENT} strokeWidth={STROKE_WIDTH} />
    </IllustrationSvg>
  );
}
