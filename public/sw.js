const CACHE_NAME = 'webino-pwa-v5';
const ADMIN_CACHE_NAME = 'webino-admin-shell-v3';
const OFFLINE_URL = '/offline.html';
const PRECACHE_URLS = [
  OFFLINE_URL,
  '/manifest.json',
  '/manifest-admin.json',
  '/icon-192.png',
  '/icon-512.png',
  '/admin',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
      caches.open(ADMIN_CACHE_NAME).then((cache) =>
        cache.addAll(['/admin', '/offline.html', '/manifest-admin.json']),
      ),
    ]),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
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

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

function isAdminNavigation(url) {
  return url.pathname === '/admin' || url.pathname.startsWith('/admin/');
}

/** فایل‌های استاتیک Next با hash در نام — امن برای کش آفلاین */
function isNextStaticAsset(url) {
  return url.pathname.startsWith('/_next/static/');
}

/** درخواست‌های دیگر Next و API نباید توسط SW intercept شوند */
function shouldBypassServiceWorker(url) {
  return url.pathname.startsWith('/_next/') || url.pathname.startsWith('/api/');
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
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
            new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain' }),
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

  if (event.request.mode === 'navigate' && isAdminNavigation(url)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const clone = response.clone();
            caches.open(ADMIN_CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('/admin') || caches.match(OFFLINE_URL)),
        ),
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200 && response.type === 'basic') {
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
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({ 'Content-Type': 'text/plain' }),
          });
        }),
      ),
  );
});
