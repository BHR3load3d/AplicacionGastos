/* eslint-env serviceworker */
/* global globalThis */
/* Simple offline-first service worker for SPA navigation and static assets */
const CACHE_NAME = 'fe-cache-v1';
const API_CACHE = 'fe-api-v1';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/logo192.png',
  '/logo512.png'
];

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => globalThis.skipWaiting())
  );
});

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME && k !== API_CACHE) {
            return caches.delete(k);
          }
          return undefined;
        })
      )
    ).then(() => globalThis.clients.claim())
  );
});

globalThis.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // API stale-while-revalidate with network timeout
  const isApi = url.pathname.startsWith('/api/') || url.href.includes('/api/');
  if (isApi) {
    event.respondWith(staleWhileRevalidateWithTimeout(req, 2000));
    return;
  }

  // SPA navigation: serve cached index.html as fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/index.html', resClone));
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match('/index.html');
          return cached || new Response('Offline', { status: 200, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // Same-origin static assets: cache-first
  if (url.origin === globalThis.location.origin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            return res;
          })
          .catch(() => caches.match('/index.html'));
      })
    );
  }
});

async function staleWhileRevalidateWithTimeout(request, timeoutMs = 2000) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request, { ignoreSearch: false });
  const cachedResponse = cached ? cached.clone() : null;

  // Fire network in background with timeout and update cache
  const networkPromise = (async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const res = await fetch(request, { signal: controller.signal });
      clearTimeout(timer);
      if (res && res.ok) {
        cache.put(request, res.clone()).catch(() => {});
      }
      return res;
    } catch (e) {
      return null;
    }
  })();

  if (cachedResponse) {
    networkPromise.then(() => {});
    return cachedResponse;
  }

  const net = await networkPromise;
  if (net) return net;
  return new Response('Offline cache miss', { status: 504, statusText: 'Gateway Timeout' });
}
