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
  assert.match(admin, /src="\/assets\/js\/pwa-admin\.js\?v=pwa-install-1"/);
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


test('Studio requests its authenticated manifest with credentials and offers install inside CMS', async () => {
  const admin = await source('admin/index.html');
  const script = await source('assets/js/pwa-admin.js');
  const styles = await source('assets/css/admin.css');
  const manifest = JSON.parse(await source('admin/manifest.webmanifest'));
  assert.ok(admin.includes('<link rel="manifest" href="/admin/manifest.webmanifest" crossorigin="use-credentials">'));
  assert.ok(admin.includes('<script src="/assets/js/pwa-admin.js?v=pwa-install-1" defer></script>'));
  assert.ok(admin.includes('id="install-studio"'));
  assert.ok(admin.includes('id="studio-install-help"'));
  assert.ok(admin.includes('id="studio-install-message"'));
  assert.ok(admin.includes('id="studio-install-help-close"'));
  assert.ok(admin.includes('href="/assets/css/admin.css?v=pwa-install-1"'));
  assert.ok(styles.includes('.studio-install-button{'));
  assert.ok(styles.includes('.studio-install-help[hidden]{display:none!important}'));
  assert.equal(manifest.id, '/admin/');
  assert.equal(manifest.start_url, '/admin/');
  assert.equal(manifest.scope, '/admin/');
  assert.ok(script.includes("register('/admin/sw.js'"));
  const middleware = await source('functions/admin/_middleware.js');
  assert.ok(middleware.includes('getAdminRole(context.request, context.env)'));
  assert.ok(middleware.includes("response.headers.set('Cache-Control', 'no-store')"));
  const worker = await source('admin/sw.js');
  assert.ok(!worker.includes('caches.open('));
  assert.ok(!worker.includes('cache.put('));
});

function simulateAdminInstall(code, opts = {}) {
  const events = {};
  const elements = {};
  const mk = (id) => {
    const listeners = {};
    const attrs = {};
    return {
      hidden: id === 'studio-install-help',
      textContent: '',
      listeners,
      addEventListener(name, fn) { listeners[name] = fn; },
      setAttribute(name, val) { attrs[name] = val; },
      getAttribute(name) { return attrs[name] ?? null; }
    };
  };
  for (const id of ['install-studio', 'studio-install-help', 'studio-install-message', 'studio-install-help-close']) elements[id] = mk(id);
  const document = {
    getElementById(id) { return elements[id] || null; },
    addEventListener(name, fn) { events['document:' + name] = fn; }
  };
  const registrations = [];
  const navigator = {
    userAgent: opts.ua ?? 'Chrome/150 Windows',
    platform: opts.platform ?? 'Win32',
    maxTouchPoints: 0,
    standalone: !!opts.installed,
    serviceWorker: {
      register(path, options) { registrations.push({ path, options }); return Promise.resolve({ scope: options.scope }); }
    }
  };
  const location = { hostname: opts.hostname || 'admin.mkulimaagricultural.org' };
  const window = {
    navigator,
    matchMedia() { return { matches: !!opts.installed, addEventListener() {} }; },
    addEventListener(name, fn) { events[name] = fn; }
  };
  runInNewContext(code, { document, navigator, location, window, Promise });
  return { elements, events, registrations };
}

test('Studio install button shows browser-specific help if no native prompt and closes on Escape', async () => {
  const script = await source('assets/js/pwa-admin.js');
  const state = simulateAdminInstall(script);
  const button = state.elements['install-studio'];
  const help = state.elements['studio-install-help'];
  assert.equal(button.hidden, false);
  assert.equal(help.hidden, true);
  button.listeners.click();
  assert.equal(help.hidden, false);
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  assert.match(state.elements['studio-install-message'].textContent, /Chrome or Microsoft Edge/);
  state.events['document:keydown']({ key: 'Escape' });
  assert.equal(help.hidden, true);
  state.events.load();
  assert.equal(state.registrations.length, 1);
  assert.equal(state.registrations[0].path, '/admin/sw.js');
  assert.equal(state.registrations[0].options.scope, '/admin/');
  assert.equal(state.registrations[0].options.updateViaCache, 'none');

  const ios = simulateAdminInstall(script, { ua: 'Mozilla/5.0 (iPhone) Safari' });
  ios.elements['install-studio'].listeners.click();
  assert.match(ios.elements['studio-install-message'].textContent, /Share.*Add to Home Screen/);

  const otherHost = simulateAdminInstall(script, { hostname: 'www.mkulimaagricultural.org' });
  assert.equal(Object.keys(otherHost.events).length, 0, 'admin installer should not initialize on public website');
});

test('Studio uses the real browser install prompt on user click and hides UI once installed', async () => {
  const script = await source('assets/js/pwa-admin.js');
  const state = simulateAdminInstall(script);
  let prevented = 0;
  let prompted = 0;
  const evt = {
    preventDefault() { prevented++; },
    prompt() { prompted++; return Promise.resolve(); },
    userChoice: Promise.resolve({ outcome: 'accepted' })
  };
  state.events.beforeinstallprompt(evt);
  assert.equal(prevented, 1);
  state.elements['install-studio'].listeners.click();
  assert.equal(prompted, 1, 'native prompt must be invoked synchronously from a user click');
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
  state.events.appinstalled();
  assert.equal(state.elements['install-studio'].hidden, true);
  assert.equal(state.elements['studio-install-help'].hidden, true);

  const standalone = simulateAdminInstall(script, { installed: true });
  assert.equal(standalone.elements['install-studio'].hidden, true);
});
