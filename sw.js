const CACHE = 'mao-public-v1';
const STATIC_PAGES = new Set(['/', '/about/', '/focus/', '/updates/', '/contact/', '/donate/']);
const OFFLINE = '/offline.html';

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll([OFFLINE, '/assets/icons/mao-192.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(Promise.all([
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith('mao-public-') && key !== CACHE).map((key) => caches.delete(key)))),
    self.clients.claim()
  ]));
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/admin/') || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
    const staticPage = STATIC_PAGES.has(path);
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (staticPage && response.ok && response.type === 'basic') {
          const cache = await caches.open(CACHE);
          await cache.put(path, response.clone());
        }
        return response;
      } catch {
        if (staticPage) {
          const cached = await caches.match(path);
          if (cached) return cached;
        }
        return (await caches.match(OFFLINE)) || new Response('You are offline.', { status: 503 });
      }
    })());
    return;
  }

  if (/^\/assets\/(?:css|js|icons)\//.test(url.pathname) || url.pathname === '/assets/img/mao-logo.png') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok && response.type === 'basic') {
          const cache = await caches.open(CACHE);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(request)) || Response.error();
      }
    })());
  }
});
