const CACHE_NAME = "webino-pwa-v7";
const ADMIN_CACHE_NAME = "webino-admin-shell-v5";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/manifest-admin.json",
  "/icon-192.png",
  "/icon-512.png",
];

async function cacheUrls(cache, urls) {
  for (const url of urls) {
    try {
      await cache.add(url);
    } catch (error) {
      console.warn("SW precache skipped", url, error);
    }
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cacheUrls(cache, PRECACHE_URLS)),
      caches.open(ADMIN_CACHE_NAME).then((cache) =>
        cacheUrls(cache, ["/offline.html", "/manifest-admin.json"]),
      ),
    ]),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== ADMIN_CACHE_NAME) {
              return caches.delete(cacheName);
            }
          }),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isAdminPath(url) {
  return url.pathname === "/admin" || url.pathname.startsWith("/admin/");
}

function isNextStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

function shouldBypassServiceWorker(url) {
  return url.pathname.startsWith("/_next/") || url.pathname.startsWith("/api/");
}

async function matchAdminShell(request) {
  const adminCache = await caches.open(ADMIN_CACHE_NAME);
  return (
    (await adminCache.match(request, { ignoreSearch: true })) ||
    (await caches.match(request, { ignoreSearch: true })) ||
    (await caches.match("/admin")) ||
    (await caches.match(OFFLINE_URL))
  );
}

async function networkThenAdminCache(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  const isAdminHome = path === "/admin" || path === "/admin/";
  try {
    const response = await fetch(request);
    if (response && response.status === 200 && response.type === "basic") {
      const cache = await caches.open(ADMIN_CACHE_NAME);
      await cache.put(request, response.clone());
      if (request.mode === "navigate" && isAdminHome) {
        await cache.put("/admin", response.clone());
      }
    }
    return response;
  } catch {
    return matchAdminShell(request);
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (isNextStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const response = await fetch(event.request);
          if (response.ok) {
            await cache.put(event.request, response.clone());
          }
          return response;
        } catch {
          return (
            cached ||
            new Response("Offline", {
              status: 503,
              statusText: "Service Unavailable",
              headers: new Headers({ "Content-Type": "text/plain" }),
            })
          );
        }
      }),
    );
    return;
  }

  if (shouldBypassServiceWorker(url)) {
    return;
  }

  if (isAdminPath(url)) {
    event.respondWith(networkThenAdminCache(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && response.type === "basic") {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === "navigate") {
            return caches.match(OFFLINE_URL);
          }
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
            headers: new Headers({ "Content-Type": "text/plain" }),
          });
        }),
      ),
  );
});
