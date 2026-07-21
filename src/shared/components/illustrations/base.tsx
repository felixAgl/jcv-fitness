import type { ReactNode } from "react";

/**
 * Shared primitives for the JCV brand illustration system.
 *
 * Motif: "el arco roto" — a 308-degree graphite arc broken at the top-right by a
 * right-angle cyan V-notch (the V of the JCV wordmark). Every illustration is the
 * same broken ring with a different subject inside it. See README.md.
 */

/** Every illustration shares one square box so a row of them optically aligns. */
export const ILLUSTRATION_VIEWBOX = "0 0 120 120";

/** Single line weight across the whole system. Never vary it. */
export const STROKE_WIDTH = 2;

/** Structure / subject lines. */
export const LINE = "var(--text-muted, #94a3b8)";
/** The one accent. At most two accent elements per illustration. */
export const ACCENT = "var(--accent-cyan, #22d3ee)";
/** The only fill allowed, used sparingly to give a shape mass. */
export const MASS = "var(--bg-card, #1a2029)";
/** Structure lines sit back so the accent reads first. */
export const LINE_OPACITY = 0.5;

/** Arc centre (60, 60), radius 40, gap centred on 45 degrees (top-right). */
const ARC_D = "M73.02 22.18A40 40 0 1 0 97.82 46.98";
/** The V-notch: a 90-degree chevron closing the gap, vertex pushed out to r=52. */
const NOTCH_D = "M73.02 22.18L96.77 23.23L97.82 46.98";

export interface IllustrationProps {
  className?: string;
  /**
   * Accessible name. Provide it when the illustration carries meaning; omit it
   * when the neighbouring copy already says the same thing (renders aria-hidden).
   */
  title?: string;
}

/**
 * The shared frame. `state="open"` (graphite arc) for anything unfinished —
 * empty, offline, lost. `state="closed"` (cyan arc) only for completion.
 */
export function BrokenArc({ state = "open" }: { state?: "open" | "closed" }) {
  const closed = state === "closed";
  return (
    <>
      <path
        d={ARC_D}
        stroke={closed ? ACCENT : LINE}
        strokeOpacity={closed ? 1 : LINE_OPACITY}
        strokeWidth={STROKE_WIDTH}
      />
      <path d={NOTCH_D} stroke={ACCENT} strokeWidth={STROKE_WIDTH} />
    </>
  );
}

export function IllustrationSvg({
  className,
  title,
  children,
}: IllustrationProps & { children: ReactNode }) {
  const labelled = typeof title === "string" && title.trim().length > 0;

  return (
    <svg
      viewBox={ILLUSTRATION_VIEWBOX}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      role={labelled ? "img" : undefined}
      aria-label={labelled ? title : undefined}
      aria-hidden={labelled ? undefined : true}
    >
      {labelled ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}
