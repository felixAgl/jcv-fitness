/**
 * jcv-analytics - first-party RUM + funnel beacon.
 *
 * POST /beacon  { event, path, value?, meta? }
 *   -> Workers Analytics Engine dataset "jcv_funnel" (binding FUNNEL)
 *      blobs:   [event, path, meta]
 *      doubles: [value]
 *      indexes: [event]
 *
 * Privacy: no PII, no cookies, no user identifiers are accepted or stored —
 * only the event name, page path and a coarse meta string.
 *
 * Deploy: npx wrangler deploy -c wrangler-analytics.toml
 */

const ALLOWED_EVENTS = new Set([
  "page_view",
  "wizard_start",
  "wizard_step",
  "wizard_complete",
  "plan_view",
  "pdf_download",
  "checkout_click",
  "payment_success",
  "whatsapp_click",
  "exercise_modal_open",
  "language_toggle",
  "web_vital_lcp",
  "web_vital_cls",
  "web_vital_inp",
]);

// Production + www, Cloudflare Pages previews/staging, and local dev.
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/(www\.)?jcv24fitness\.com$/,
  /^https:\/\/([a-z0-9-]+\.)?jcv24fitness\.pages\.dev$/,
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
];

function isAllowedOrigin(origin) {
  return (
    typeof origin === "string" &&
    ALLOWED_ORIGIN_PATTERNS.some((re) => re.test(origin))
  );
}

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": isAllowedOrigin(origin)
      ? origin
      : "https://jcv24fitness.com",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

function clip(value, max) {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (url.pathname !== "/beacon") {
      return new Response("Not found", { status: 404, headers });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers });
    }

    // Browser requests carry an Origin header; reject foreign sites.
    // Requests without Origin (curl, monitors) are allowed through.
    if (origin !== null && !isAllowedOrigin(origin)) {
      return new Response("Forbidden origin", { status: 403, headers });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON", { status: 400, headers });
    }

    const { event, path, value, meta } = body ?? {};

    if (typeof event !== "string" || !ALLOWED_EVENTS.has(event)) {
      return new Response("Unknown event", { status: 400, headers });
    }
    if (typeof path !== "string" || path.length === 0) {
      return new Response("Missing path", { status: 400, headers });
    }
    if (value !== undefined && !Number.isFinite(value)) {
      return new Response("Invalid value", { status: 400, headers });
    }
    if (meta !== undefined && typeof meta !== "string") {
      return new Response("Invalid meta", { status: 400, headers });
    }

    env.FUNNEL.writeDataPoint({
      blobs: [event, clip(path, 256), clip(meta, 256)],
      doubles: [value ?? 1],
      indexes: [event],
    });

    return new Response(null, { status: 202, headers });
  },
};
