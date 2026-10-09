import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('public and Studio manifests are separately scoped and have real install icons', async () => {
  const publicManifest = JSON.parse(await source('manifest.webmanifest'));
  const adminManifest = JSON.parse(await source('admin/manifest.webmanifest'));
  assert.equal(publicManifest.start_url, '/');
  assert.equal(publicManifest.scope, '/');
  assert.equal(adminManifest.start_url, '/admin/');
  assert.equal(adminManifest.scope, '/admin/');
  assert.equal(publicManifest.display, 'standalone');
  assert.equal(adminManifest.display, 'standalone');
  for (const manifest of [publicManifest, adminManifest]) {
    for (const size of [192, 512]) {
      const icon = manifest.icons.find((item) => item.sizes === `${size}x${size}` && item.purpose === 'any');
      assert.ok(icon);
      const bytes = await readFile(new URL(`..${icon.src}`, import.meta.url));
      assert.equal(bytes.subarray(1, 4).toString(), 'PNG');
      assert.equal(bytes.readUInt32BE(16), size);
      assert.equal(bytes.readUInt32BE(20), size);
    }
  }
});

test('public pages and article HTML register the public PWA; Studio uses its own scope', async () => {
  for (const page of ['index.html', 'about/index.html', 'focus/index.html', 'updates/index.html', 'contact/index.html', 'donate/index.html']) {
    const html = await source(page);
    assert.match(html, /rel="manifest" href="\/manifest\.webmanifest"/);
    assert.match(html, /src="\/assets\/js\/pwa-public\.js"/);
  }
  const article = await source('functions/updates/[id].js');
  assert.match(article, /rel="manifest" href="\/manifest\.webmanifest"/);
  assert.match(article, /src="\/assets\/js\/pwa-public\.js"/);
  const admin = await source('admin/index.html');
  assert.match(admin, /rel="manifest" href="\/admin\/manifest\.webmanifest"/);
  assert.match(admin, /src="\/assets\/js\/pwa-admin\.js"/);
  const registration = await source('assets/js/pwa-admin.js');
  assert.match(registration, /register\('\/admin\/sw\.js', \{ scope: '\/admin\/'/);
});

test('Studio worker never intercepts API calls and returns only a generic offline page', async () => {
  const script = await source('admin/sw.js');
  assert.doesNotMatch(script, /caches\.|cache\.put/);
  const listeners = {};
  const context = {
    self: { location: { origin: 'https://admin.mkulimaagricultural.org' }, addEventListener: (name, fn) => { listeners[name] = fn; }, skipWaiting() {}, clients: { claim() {} } },
    URL, Response,
    fetch: async () => { throw new Error('offline'); }
  };
  runInNewContext(script, context);
  let intercepted = false;
  listeners.fetch({ request: { url: 'https://admin.mkulimaagricultural.org/admin/api/posts', method: 'GET', mode: 'navigate' }, respondWith() { intercepted = true; } });
  assert.equal(intercepted, false);
  let pending;
  listeners.fetch({ request: { url: 'https://admin.mkulimaagricultural.org/admin/', method: 'GET', mode: 'navigate' }, respondWith(value) { pending = value; } });
  const response = await pending;
  assert.equal(response.status, 503);
  assert.match(await response.text(), /Reconnect and sign in/);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
});

test('public worker excludes admin and API paths from offline cache', async () => {
  const script = await source('sw.js');
  assert.match(script, /url\.pathname\.startsWith\('\/admin\/'\)/);
  assert.match(script, /url\.pathname\.startsWith\('\/api\/'\)/);
  assert.match(script, /request\.mode === 'navigate'/);
  assert.match(script, /caches\.match\(OFFLINE\)/);
  const build = await source('scripts/build.mjs');
  assert.match(build, /'offline\.html', 'manifest\.webmanifest', 'sw\.js'/);
});
