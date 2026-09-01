const CACHE_NAME = "oil-pwa-v1";
const PRECACHE_URLS = [
  "/oil",
  "/manifest-oil.json",
  "/icon-192.png",
  "/icon-512.png",
];

async function cacheUrls(cache, urls) {
  for (const url of urls) {
    try {
      await cache.add(url);
    } catch (error) {
      console.warn("oil SW precache skipped", url, error);
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cacheUrls(cache, PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith("oil-pwa-") && name !== CACHE_NAME)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(
          (cached) =>
            cached ||
            caches.match("/oil") ||
            new Response("Offline", {
              status: 503,
              statusText: "Service Unavailable",
            }),
        ),
      ),
  );
});
