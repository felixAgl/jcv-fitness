import {
  ACCENT,
  BrokenArc,
  IllustrationSvg,
  LINE,
  LINE_OPACITY,
  MASS,
  STROKE_WIDTH,
  type IllustrationProps,
} from "./base";

/** No plan yet: a sheet with only the first line written. */
export function EmptyPlan({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <BrokenArc />
      <rect
        x={38}
        y={38}
        width={44}
        height={48}
        rx={4}
        fill={MASS}
        stroke={LINE}
        strokeOpacity={LINE_OPACITY}
        strokeWidth={STROKE_WIDTH}
      />
      <path d="M46 52H70" stroke={ACCENT} strokeWidth={STROKE_WIDTH} />
      <path
        d="M46 62H74"
        stroke={LINE}
        strokeOpacity={LINE_OPACITY}
        strokeWidth={STROKE_WIDTH}
      />
      <path
        d="M46 72H66"
        stroke={LINE}
        strokeOpacity={LINE_OPACITY}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray="4 5"
      />
    </IllustrationSvg>
  );
}
