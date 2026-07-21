import {
  ACCENT,
  BrokenArc,
  IllustrationSvg,
  LINE,
  LINE_OPACITY,
  STROKE_WIDTH,
  type IllustrationProps,
} from "./base";

/** Offline: the signal fans out, the accent cuts it. */
export function NoConnection({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <BrokenArc />
      <g stroke={LINE} strokeOpacity={LINE_OPACITY} strokeWidth={STROKE_WIDTH}>
        <path d="M51.81 72.26A10 10 0 0 1 68.19 72.26" />
        <path d="M43.62 66.52A20 20 0 0 1 76.38 66.52" />
        <path d="M35.43 60.79A30 30 0 0 1 84.57 60.79" />
        <path d="M60 78h.01" strokeWidth={5} />
      </g>
      <path d="M44 88L80 52" stroke={ACCENT} strokeWidth={STROKE_WIDTH} />
    </IllustrationSvg>
  );
}
