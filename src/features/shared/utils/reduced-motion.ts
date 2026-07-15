/**
 * True when the user asked the OS for reduced motion. Guarded so it is safe
 * during SSR/static export and in jsdom (which lacks matchMedia).
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
