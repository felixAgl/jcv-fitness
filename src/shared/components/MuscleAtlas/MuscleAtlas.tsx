import type { AtlasRegionId, AtlasView } from "./atlas-data";
import {
  ATLAS_BODY_BASE,
  ATLAS_OUTLINE,
  ATLAS_REGIONS,
  ATLAS_VIEWBOX,
} from "./atlas-data";
import { resolveRegion } from "./muscle-map";

export interface MuscleAtlasProps {
  /** Which side of the body to draw. */
  view: AtlasView;
  /** Muscles highlighted in full accent cyan (dataset vocabulary, e.g. "pectorals"). */
  primary?: string[];
  /** Muscles highlighted in dimmed cyan (~35% opacity). */
  secondary?: string[];
  /** Sizing and spacing. Always set a width and height. */
  className?: string;
  /**
   * Accessible name. Present -> role="img" + aria-label + <title>.
   * Absent -> aria-hidden (decorative).
   */
  title?: string;
}

/**
 * Palette follows the illustration system (see illustrations/README.md):
 * LINE (--text-muted) for structure, ACCENT (--accent-cyan) for highlighted
 * muscles, MASS (--bg-card) for the body silhouette fill. Hex fallbacks keep
 * the atlas correct when rendered outside the app stylesheet (tests, reels).
 */
const LINE = "var(--text-muted, #94a3b8)";
const ACCENT = "var(--accent-cyan, #22d3ee)";
const MASS = "var(--bg-card, #1a2029)";

type Emphasis = "primary" | "secondary";

function resolveEmphasis(
  primary: string[],
  secondary: string[]
): Partial<Record<AtlasRegionId, Emphasis>> {
  const emphasis: Partial<Record<AtlasRegionId, Emphasis>> = {};
  // secondary first so a muscle listed in both ends up primary
  for (const muscle of secondary) {
    const region = resolveRegion(muscle);
    if (region) emphasis[region] ??= "secondary";
  }
  for (const muscle of primary) {
    const region = resolveRegion(muscle);
    if (region) emphasis[region] = "primary";
  }
  return emphasis;
}

/**
 * 2D anatomical body map with individually highlightable muscle groups,
 * derived from the MIT-licensed react-native-body-highlighter male body
 * (attribution in atlas-data.ts). Designed for dark backgrounds and legible
 * from 80px (modal) to 400px+ (reels, PDF).
 */
export function MuscleAtlas({
  view,
  primary = [],
  secondary = [],
  className,
  title,
}: MuscleAtlasProps) {
  const emphasis = resolveEmphasis(primary, secondary);
  const a11y = title
    ? ({ role: "img", "aria-label": title } as const)
    : ({ "aria-hidden": true } as const);

  return (
    <svg
      viewBox={ATLAS_VIEWBOX[view]}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      data-view={view}
      {...a11y}
    >
      {title ? <title>{title}</title> : null}

      {/* body mass: silhouette contour filled with the card tone */}
      <path d={ATLAS_OUTLINE[view]} fill={MASS} stroke="none" />

      {/* structural shapes (head, hands, feet...) — faint, never highlighted */}
      {ATLAS_BODY_BASE[view].map((d, i) => (
        <path key={`base-${i}`} d={d} fill={LINE} fillOpacity={0.1} />
      ))}

      {/* muscle regions */}
      {(Object.keys(ATLAS_REGIONS) as AtlasRegionId[]).map((region) => {
        const paths = ATLAS_REGIONS[region][view];
        if (paths.length === 0) return null;
        const state = emphasis[region];
        const fill = state ? ACCENT : LINE;
        const fillOpacity = state === "primary" ? 1 : state === "secondary" ? 0.35 : 0.14;
        return (
          <g
            key={region}
            data-region={region}
            data-emphasis={state ?? "none"}
            fill={fill}
            fillOpacity={fillOpacity}
          >
            {paths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
        );
      })}

      {/* contour on top so the outline stays crisp over highlighted fills */}
      <path
        d={ATLAS_OUTLINE[view]}
        fill="none"
        stroke={LINE}
        strokeOpacity={0.45}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
