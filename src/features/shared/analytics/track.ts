/**
 * First-party funnel/RUM tracking. Fires anonymous beacons to the
 * jcv-analytics Cloudflare Worker (Workers Analytics Engine).
 *
 * Privacy: no PII, no cookies, no user ids — only event name, page path and
 * a coarse meta string are ever sent.
 *
 * No-ops on localhost unless the page URL contains ?debug_analytics.
 */

export type AnalyticsEvent =
  | "page_view"
  | "wizard_start"
  | "wizard_step" // value = step number
  | "wizard_complete"
  | "plan_view"
  | "pdf_download"
  | "checkout_click" // meta = tier
  | "payment_success"
  | "whatsapp_click"
  | "exercise_modal_open" // meta = exercise id
  | "language_toggle" // meta = new lang
  | "web_vital_lcp" // value = ms
  | "web_vital_cls" // value = score
  | "web_vital_inp"; // value = ms

const ENDPOINT = "https://jcv-analytics.fagal142010.workers.dev/beacon";

function isDisabled(): boolean {
  if (typeof window === "undefined") return true; // SSR / static prerender
  const isLocal = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);
  return isLocal && !window.location.search.includes("debug_analytics");
}

export function track(
  event: AnalyticsEvent,
  value?: number,
  meta?: string
): void {
  if (isDisabled()) return;

  // Plain string body keeps this a CORS "simple request" (no preflight).
  const payload = JSON.stringify({
    event,
    path: window.location.pathname,
    ...(value !== undefined ? { value } : {}),
    ...(meta !== undefined ? { meta } : {}),
  });

  try {
    if (navigator.sendBeacon?.(ENDPOINT, payload)) return;
  } catch {
    // Fall through to fetch.
  }

  fetch(ENDPOINT, {
    method: "POST",
    body: payload,
    keepalive: true,
    headers: { "Content-Type": "text/plain" },
  }).catch(() => {
    // Analytics is always best-effort; never surface errors.
  });
}
