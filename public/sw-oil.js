const CACHE_NAME = "oil-pwa-v2";
const PRECACHE_URLS = [
  "/oil",
  "/oil/new",
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

function isOilAppPath(url) {
  return (
    url.pathname === "/oil" ||
    url.pathname.startsWith("/oil/") ||
    url.pathname === "/manifest-oil.json"
  );
}

function isNextStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/");
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

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === "basic") {
      await cache.put(request, response.clone());
      if (request.mode === "navigate") {
        const path = new URL(request.url).pathname.replace(/\/$/, "") || "/oil";
        if (path === "/oil" || path === "/oil/new") {
          await cache.put(path, response.clone());
        }
      }
    }
    return response;
  } catch {
    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match(new URL(request.url).pathname)) ||
      (await cache.match("/oil")) ||
      new Response("Offline", {
        status: 503,
        statusText: "Service Unavailable",
      })
    );
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (isNextStaticAsset(url)) {
    event.respondWith(
      cacheFirst(event.request).catch(
        () =>
          new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          }),
      ),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/")) {
    return;
  }

  if (!isOilAppPath(url)) return;

  event.respondWith(networkFirst(event.request));
});
