/**
 * Hero's Forge — Service Worker (Phase 2 PWA, slice 1: offline read).
 *
 * Three caching strategies keyed by request type:
 *   - App shell + immutable static assets (/_next/static/*, /worlds/*,
 *     fonts, manifest, icons): cache-first.
 *   - Navigation requests (HTML): network-first, fall back to cache,
 *     then to the branded /offline page when both miss.
 *   - Same-origin GET JSON read-only APIs (/api/children, /api/story
 *     reads): stale-while-revalidate so a previously opened story stays
 *     readable in the cabin even when the connection is lost.
 *
 * Bump CACHE_VERSION to invalidate every cache (e.g. after schema or
 * route changes that would break a stale cached HTML response).
 */

const CACHE_VERSION = "v1";
const APP_SHELL_CACHE = `hf-shell-${CACHE_VERSION}`;
const PAGES_CACHE = `hf-pages-${CACHE_VERSION}`;
const DATA_CACHE = `hf-data-${CACHE_VERSION}`;
const KNOWN_CACHES = new Set([APP_SHELL_CACHE, PAGES_CACHE, DATA_CACHE]);

const OFFLINE_URL = "/offline";

const PRECACHE_URLS = [OFFLINE_URL, "/manifest.webmanifest", "/favicon.ico"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(APP_SHELL_CACHE);
      // Use { cache: "reload" } so we never trust a stale HTTP cache for
      // the offline shell — it must always reflect the latest deploy.
      await Promise.all(
        PRECACHE_URLS.map((url) =>
          cache
            .add(new Request(url, { cache: "reload" }))
            .catch(() => undefined)
        )
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith("hf-") && !KNOWN_CACHES.has(name))
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

/* ── Routing helpers ─────────────────────────────────────────────────── */

function isStaticAsset(url) {
  if (url.pathname.startsWith("/_next/static/")) return true;
  if (url.pathname.startsWith("/worlds/")) return true;
  if (/\.(?:png|jpg|jpeg|svg|gif|webp|ico|woff2?|ttf|otf|eot)$/i.test(url.pathname)) {
    return true;
  }
  if (url.pathname === "/manifest.webmanifest") return true;
  return false;
}

function isReadOnlyApi(url) {
  if (!url.pathname.startsWith("/api/")) return false;
  // Auth + mutations + streaming routes must always hit the network.
  if (url.pathname.startsWith("/api/auth/")) return false;
  if (url.pathname.startsWith("/api/story/page")) return false;
  if (url.pathname.startsWith("/api/chat")) return false;
  // Allow GET reads for stories list, single story, and child profiles.
  return /^\/api\/(children|story)(\/|$)/.test(url.pathname);
}

function shouldBypass(request, url) {
  if (request.method !== "GET") return true;
  if (url.origin !== self.location.origin) return true;
  // Next.js dev / HMR — never get in the way during local development.
  if (url.pathname.startsWith("/_next/webpack-hmr")) return true;
  if (url.pathname.startsWith("/__nextjs")) return true;
  // PDF export is large + auth-sensitive; let the browser stream it.
  if (/\/api\/story\/[^/]+\/pdf/.test(url.pathname)) return true;
  return false;
}

/* ── Strategies ──────────────────────────────────────────────────────── */

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(PAGES_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok && response.type === "basic") {
      cache.put(request, response.clone()).catch(() => undefined);
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
    return new Response("Offline", {
      status: 503,
      statusText: "Offline",
      headers: { "Content-Type": "text/plain" },
    });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(DATA_CACHE);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok && response.type === "basic") {
        cache.put(request, response.clone()).catch(() => undefined);
      }
      return response;
    })
    .catch(() => undefined);
  if (cached) {
    networkPromise.catch(() => undefined);
    return cached;
  }
  const fresh = await networkPromise;
  if (fresh) return fresh;
  return new Response(JSON.stringify({ offline: true }), {
    status: 503,
    statusText: "Offline",
    headers: { "Content-Type": "application/json" },
  });
}

/* ── Fetch dispatcher ────────────────────────────────────────────────── */

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (shouldBypass(request, url)) return;

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, APP_SHELL_CACHE));
    return;
  }

  if (isReadOnlyApi(url)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
});
