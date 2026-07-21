import {
  ACCENT,
  BrokenArc,
  IllustrationSvg,
  LINE,
  LINE_OPACITY,
  STROKE_WIDTH,
  type IllustrationProps,
} from "./base";

const COLS = [38, 54, 70];
const ROWS = [38, 54, 70];
/** The cell you are asked to mark first. */
const TODAY = { x: 54, y: 54 };

/** No tracked days yet: an untouched week grid with today waiting. */
export function EmptyProgress({ className, title }: IllustrationProps) {
  return (
    <IllustrationSvg className={className} title={title}>
      <BrokenArc />
      {ROWS.map((y) =>
        COLS.map((x) => {
          const isToday = x === TODAY.x && y === TODAY.y;
          return (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width={12}
              height={12}
              rx={2}
              stroke={isToday ? ACCENT : LINE}
              strokeOpacity={isToday ? 1 : LINE_OPACITY}
              strokeWidth={STROKE_WIDTH}
            />
          );
        })
      )}
    </IllustrationSvg>
  );
}
