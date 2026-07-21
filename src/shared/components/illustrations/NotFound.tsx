import {
  ACCENT,
  BrokenArc,
  IllustrationSvg,
  LINE,
  LINE_OPACITY,
  STROKE_WIDTH,
  type IllustrationProps,
} from "./base";

/** 404: the route runs out before it arrives. */
export function NotFound({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <BrokenArc />
      <path
        d="M38 90C40 80 44 74 52 70"
        stroke={LINE}
        strokeOpacity={LINE_OPACITY}
        strokeWidth={STROKE_WIDTH}
        strokeDasharray="4 6"
      />
      <g stroke={ACCENT} strokeWidth={STROKE_WIDTH}>
        <path d="M59 55L73 69" />
        <path d="M73 55L59 69" />
      </g>
    </IllustrationSvg>
  );
}
