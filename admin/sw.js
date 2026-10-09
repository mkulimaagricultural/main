const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>MAo Studio is offline</title><style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f6f1;color:#15382b;font:1rem/1.6 system-ui,sans-serif}main{max-width:32rem;padding:2rem;text-align:center}h1{font:700 2rem Georgia,serif}a{color:#a9482e;font-weight:700}</style></head><body><main><h1>MAo Studio is offline</h1><p>Reconnect and sign in to view or publish updates. No admin data is saved for offline use.</p><a href="/admin/">Try again</a></main></body></html>`;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate' || event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith('/admin/') || url.pathname.startsWith('/admin/api/')) return;
  event.respondWith(fetch(event.request).catch(() => new Response(OFFLINE_HTML, {
    status: 503,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }
  })));
});
