const CACHE_NAME = "webino-pwa-v10";
const ADMIN_CACHE_NAME = "webino-admin-shell-v8";
const ADMIN_HOME = "/admin";
const OFFLINE_URL = "/offline.html";
const PRECACHE_URLS = [
  OFFLINE_URL,
  "/manifest.json",
  "/manifest-admin.json",
  "/pic/icon.png",
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
  if (event.data && event.data.type === "WARM_CACHE") {
    event.waitUntil(warmCache(event.data));
  }
});

/**
 * صفحه فعلی و فایل‌های /_next/static که قبل از کنترل SW لود شده‌اند را کش می‌کند
 * تا بار اول هم صفحه بدون اینترنت باز شود.
 */
async function warmCache(data) {
  const urls = Array.isArray(data.urls) ? data.urls : [];
  const staticCache = await caches.open(CACHE_NAME);
  for (const raw of urls) {
    try {
      const url = new URL(raw, self.location.origin);
      if (url.origin !== self.location.origin || !isNextStaticAsset(url)) continue;
      if (await staticCache.match(url.href)) continue;
      const response = await fetch(url.href);
      if (isCacheableStaticResponse(response)) {
        await staticCache.put(url.href, response);
      }
    } catch {
      /* ignore */
    }
  }

  if (typeof data.page === "string") {
    try {
      const pageUrl = new URL(data.page, self.location.origin);
      if (pageUrl.origin === self.location.origin && isAdminPath(pageUrl)) {
        const response = await fetch(pageUrl.pathname, { cache: "no-store", credentials: "same-origin" });
        await cacheAdminPage(pageUrl.pathname, response);
      }
    } catch {
      /* ignore */
    }
  }
}

function isHtmlResponse(response) {
  const type = (response.headers.get("content-type") || "").toLowerCase();
  return type.indexOf("text/html") !== -1;
}

function adminPageKey(pathname) {
  const trimmed = pathname.replace(/\/+$/, "");
  return trimmed === "" ? ADMIN_HOME : trimmed;
}

async function cacheAdminPage(pathname, response) {
  if (!response || response.status !== 200 || response.type !== "basic" || response.redirected) return;
  if (!isHtmlResponse(response)) return;
  const cache = await caches.open(ADMIN_CACHE_NAME);
  await cache.put(adminPageKey(pathname), response.clone());
}

async function cachedAdminPage(pathname) {
  const cache = await caches.open(ADMIN_CACHE_NAME);
  return cache.match(adminPageKey(pathname), { ignoreSearch: true, ignoreVary: true });
}

function isAdminPath(url) {
  return url.pathname === "/admin" || url.pathname.startsWith("/admin/");
}

function isOilPath(url) {
  return (
    url.pathname === "/oil" ||
    url.pathname.startsWith("/oil/") ||
    url.pathname === "/manifest-oil.json"
  );
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
    (await adminCache.match(request, { ignoreSearch: true, ignoreVary: true })) ||
    (await caches.match(request, { ignoreSearch: true, ignoreVary: true })) ||
    new Response("Offline", { status: 503, statusText: "Service Unavailable" })
  );
}

function isCacheableStaticResponse(response) {
  if (!response || !response.ok) return false;
  const type = (response.headers.get("content-type") || "").toLowerCase();
  if (type.indexOf("text/html") !== -1) return false;
  return true;
}

const NAVIGATION_TIMEOUT_MS = 5000;

/** وای‌فای وصل ولی بدون اینترنت: اگر نسخهٔ کش وجود دارد بیش از چند ثانیه منتظر شبکه نمانیم */
async function fetchNavigation(request, pathname) {
  const hasCached = Boolean(await cachedAdminPage(pathname)) || Boolean(await cachedAdminPage(ADMIN_HOME));
  const fetching = fetch(request, { cache: "no-store" }).then((response) => {
    if (hasCached && response.status >= 500) {
      throw new Error("server error");
    }
    return response;
  });
  if (!hasCached) return fetching;
  return Promise.race([
    fetching,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), NAVIGATION_TIMEOUT_MS)),
  ]);
}

async function networkThenAdminCache(request) {
  const url = new URL(request.url);
  const isNavigate = request.mode === "navigate";
  try {
    const response = isNavigate
      ? await fetchNavigation(request, url.pathname)
      : await fetch(request, { cache: "no-store" });
    if (isNavigate) {
      await cacheAdminPage(url.pathname, response);
    } else if (response && response.status === 200 && response.type === "basic") {
      const cache = await caches.open(ADMIN_CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    if (!isNavigate) {
      return matchAdminShell(request);
    }
    // بدون اینترنت: نسخهٔ کش‌شدهٔ همان صفحه؛ وگرنه صفحه فروش؛ در آخر صفحهٔ آفلاین
    const page = await cachedAdminPage(url.pathname);
    if (page) return page;
    if (adminPageKey(url.pathname) !== ADMIN_HOME && (await cachedAdminPage(ADMIN_HOME))) {
      return Response.redirect(ADMIN_HOME, 302);
    }
    return (await caches.match(OFFLINE_URL)) || new Response("Offline", { status: 503 });
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

  if (url.searchParams.has("_rsc") || event.request.headers.get("RSC") === "1") {
    return;
  }

  if (isNextStaticAsset(url)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(event.request);
          if (isCacheableStaticResponse(response)) {
            await cache.put(event.request, response.clone());
          }
          return response;
        } catch {
          const cached = await cache.match(event.request, { ignoreVary: true });
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

  // اپ /oil جداست؛ HTML و مانیفست آن وارد کش فروشگاه/ادمین نشود
  if (isOilPath(url)) {
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
            return cachedAdminPage(ADMIN_HOME).then((adminHome) =>
              adminHome ? Response.redirect(ADMIN_HOME, 302) : caches.match(OFFLINE_URL),
            );
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
