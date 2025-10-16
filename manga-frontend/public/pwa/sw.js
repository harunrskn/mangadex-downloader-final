// src/pwa/sw.js
const CACHE_NAME = "moco-reader-v2"; // bump jika ubah strategi
const PAGE_CACHE_LIMIT = 80;
const ALLOW_PATHS = [/^\/api\/img\//, /^\/assets\//, /^\/images\//];

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // ⛔ Jangan intercept cross-origin (uploads.mangadex.org biarkan lewat langsung)
  if (url.origin !== self.location.origin) return;

  const isImagePath = /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url.pathname);
  const isAllowed = isImagePath || ALLOW_PATHS.some((re) => re.test(url.pathname));
  if (!isAllowed) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    // Stale-While-Revalidate sederhana
    const cached = await cache.match(req);
    if (cached) {
      event.waitUntil(refreshAndTrim(cache, req));
      return cached;
    }

    try {
      const resp = await fetch(req);
      if (resp && resp.ok && resp.type !== "opaque") {
        await trimCache(cache);
        cache.put(req, resp.clone());
      }
      return resp;
    } catch (e) {
      return cached || Response.error();
    }
  })());
});

async function refreshAndTrim(cache, req) {
  try {
    const resp = await fetch(req, { cache: "no-store" });
    if (resp && resp.ok && resp.type !== "opaque") {
      await trimCache(cache);
      await cache.put(req, resp.clone());
    }
  } catch (_) { }
}

async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length > PAGE_CACHE_LIMIT) {
    const removeCount = Math.max(1, keys.length - PAGE_CACHE_LIMIT);
    await Promise.all(keys.slice(0, removeCount).map((k) => cache.delete(k)));
  }
}
