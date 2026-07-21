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

/** The human on the other side: a figure wearing the V as an insignia. */
export function Coach({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <BrokenArc />
      <circle
        cx={60}
        cy={42}
        r={10}
        fill={MASS}
        stroke={LINE}
        strokeOpacity={LINE_OPACITY}
        strokeWidth={STROKE_WIDTH}
      />
      <path
        d="M38 88C38 66 47 56 60 56C73 56 82 66 82 88"
        fill={MASS}
        stroke={LINE}
        strokeOpacity={LINE_OPACITY}
        strokeWidth={STROKE_WIDTH}
      />
      <path d="M54 80L60 74L66 80" stroke={ACCENT} strokeWidth={STROKE_WIDTH} />
    </IllustrationSvg>
  );
}
