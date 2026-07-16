/**
 * JCV 24 Fitness service worker — "gym-basement mode".
 *
 * Plain JS on purpose (no next-pwa/workbox: they fight the app-router static
 * export and hide the caching policy). Everything cacheable is listed here so
 * the policy stays auditable.
 *
 * Strategy summary:
 *  - install: precache the app shell (/, /plan/view, /wizard) and the
 *    exercise library JSON.
 *  - navigations: network-first, falling back to the cached page, then to the
 *    cached /plan/view shell (the page a gym user actually needs offline).
 *  - media.jcv24fitness.com (posters/, videos-mp4/, images/): cache-first
 *    with a FIFO trim at MEDIA_MAX_ENTRIES (approximate LRU: re-fetches are
 *    served from cache so entry order ~= first-use order; good enough to
 *    bound disk usage without an index).
 *  - same-origin /_next/static/ and /data/: stale-while-revalidate (hashed
 *    assets are immutable anyway; /data/ picks up library updates next load).
 *  - NEVER cached: supabase.co (auth/plan data), mercadopago (payments),
 *    wa.me (WhatsApp), the analytics beacon worker. Non-GET is never touched.
 *
 * Version bumps: increment CACHE_VERSION on any strategy/precache change.
 * activate deletes every jcv-* cache from other versions; skipWaiting +
 * clients.claim make the new worker take over immediately.
 */

const CACHE_VERSION = "v1";
const SHELL_CACHE = `jcv-shell-${CACHE_VERSION}`;
const STATIC_CACHE = `jcv-static-${CACHE_VERSION}`;
const MEDIA_CACHE = `jcv-media-${CACHE_VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, STATIC_CACHE, MEDIA_CACHE];

const MEDIA_HOST = "media.jcv24fitness.com";
const MEDIA_MAX_ENTRIES = 150;

const PRECACHE_URLS = ["/", "/plan/view", "/wizard", "/data/exercise-library.json"];

/** Hosts the SW must never cache or intercept (auth, payments, analytics). */
const BYPASS_HOSTS = [
  "supabase.co",
  "supabase.in",
  "mercadopago.com",
  "mercadopago.com.co",
  "mercadolibre.com",
  "wa.me",
  "api.whatsapp.com",
  "jcv-analytics.fagal142010.workers.dev",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        cache.addAll(PRECACHE_URLS.map((url) => new Request(url, { cache: "reload" })))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("jcv-") && !CURRENT_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

/** FIFO trim so the media cache never grows past MEDIA_MAX_ENTRIES. */
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  // cache.keys() returns entries in insertion order: drop the oldest first.
  await Promise.all(keys.slice(0, keys.length - maxEntries).map((key) => cache.delete(key)));
}

/** Cache-first for exercise media (GIF posters, MP4 clips, images). */
async function cacheFirstMedia(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    const cache = await caches.open(MEDIA_CACHE);
    await cache.put(request, response.clone());
    // Fire-and-forget: trimming must not delay the response.
    trimCache(MEDIA_CACHE, MEDIA_MAX_ENTRIES);
  }
  return response;
}

/** Stale-while-revalidate for hashed build assets and /data/ JSON. */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached); // Offline: whatever we had (or undefined -> throws).
  return cached || network;
}

/** Network-first for page navigations; offline falls back to cached shell. */
async function networkFirstNavigation(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    // Last resort: the plan shell, which is what an offline gym user needs.
    const shell = await caches.match("/plan/view");
    if (shell) return shell;
    throw new Error("offline and not cached");
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Hard bypass: auth, payments, WhatsApp, analytics go straight to network.
  if (BYPASS_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
    return;
  }

  if (url.hostname === MEDIA_HOST) {
    event.respondWith(cacheFirstMedia(request));
    return;
  }

  // Everything below is same-origin only.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/data/")) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }

  // Other same-origin GETs (fonts/, images/, icons/): opportunistic SWR too,
  // so the installed app keeps its chrome offline.
  if (/\.(png|svg|webp|jpg|jpeg|woff2?|ico)$/.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
