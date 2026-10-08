import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

function simulate(source, options = {}) {
  const classes = new Set();
  const storage = options.storage || new Map();
  const listeners = new Map();
  const timers = [];
  const overlay = { id: 'mao-home-intro', removed: false, remove() { this.removed = true; } };
  const document = {
    documentElement: { classList: {
      add(name) { classes.add(name); },
      remove(name) { classes.delete(name); }
    } },
    addEventListener(name, callback) { listeners.set(name, callback); },
    getElementById(id) { return id === overlay.id ? overlay : null; }
  };
  const window = {
    matchMedia() { return { matches: Boolean(options.reducedMotion) }; },
    sessionStorage: {
      getItem(key) {
        if (options.blockStorage) throw new Error('Storage disabled');
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        if (options.blockStorage) throw new Error('Storage disabled');
        storage.set(key, value);
      }
    },
    setTimeout(callback, duration) { timers.push({ callback, duration }); }
  };
  runInNewContext(source, { window, document });
  return { classes, storage, listeners, timers, overlay };
}

test('home intro consists only of the MAo logo, loads before paint, and is never added to subpages', async () => {
  const home = await read('index.html');
  assert.ok(home.includes('<script src="assets/js/home-intro.js?v=1"></script>'));
  assert.ok(home.includes('mao.css?v=home-intro-1'));
  assert.ok(home.indexOf('home-intro.js?v=1') < home.indexOf('<body>'));
  const markup = home.match(/<div id="mao-home-intro" class="mao-home-intro" aria-hidden="true">([\s\S]*?)<\/div>/);
  assert.ok(markup, 'homepage has one center-logo overlay');
  assert.equal((home.match(/id="mao-home-intro"/g) || []).length, 1);
  assert.match(markup[1], /^<img src="assets\/img\/mao-logo\.png" alt=""[^>]*>$/);
  assert.ok(!/<(?:h[1-6]|p|span|a|button)\b/.test(markup[1]));
  for (const path of ['about/index.html', 'focus/index.html', 'updates/index.html', 'contact/index.html', 'donate/index.html']) {
    const otherPage = await read(path);
    assert.ok(!otherPage.includes('id="mao-home-intro"'), path);
    assert.ok(!otherPage.includes('home-intro.js'), path);
  }
});

test('intro CSS centers logo, fades cleanly, and fails closed if JavaScript stalls', async () => {
  const css = await read('assets/css/mao.css');
  assert.ok(css.includes('.mao-home-intro{display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center'));
  assert.ok(css.includes('html.mao-home-intro-active .mao-home-intro{display:flex'));
  assert.ok(css.includes('@keyframes mao-home-intro-logo'));
  assert.ok(css.includes('@keyframes mao-home-intro-curtain'));
  assert.ok(css.includes('100%{opacity:0;visibility:hidden}'));
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce){html.mao-home-intro-active .mao-home-intro{display:none!important}'));
});

test('intro shows once per tab session and clears on animation finish', async () => {
  const script = await read('assets/js/home-intro.js');
  const storage = new Map();
  const first = simulate(script, { storage });
  assert.equal(first.classes.has('mao-home-intro-active'), true);
  assert.equal(storage.get('mao-home-logo-intro-shown'), '1');
  assert.equal(first.timers.length, 1);
  assert.equal(first.timers[0].duration, 1600);
  first.listeners.get('animationend')({ target: { id: 'another-animation' } });
  assert.equal(first.classes.has('mao-home-intro-active'), true);
  first.listeners.get('animationend')({ target: first.overlay });
  assert.equal(first.classes.has('mao-home-intro-active'), false);
  assert.equal(first.overlay.removed, true);

  const second = simulate(script, { storage });
  assert.equal(second.classes.has('mao-home-intro-active'), false);
  assert.equal(second.timers.length, 0);
});

test('reduced-motion preference skips intro and fallback timeout clears it if animation does not fire', async () => {
  const script = await read('assets/js/home-intro.js');
  const reduced = simulate(script, { reducedMotion: true });
  assert.equal(reduced.classes.has('mao-home-intro-active'), false);
  assert.equal(reduced.timers.length, 0);
  assert.equal(reduced.storage.size, 0);

  const failedStorage = simulate(script, { blockStorage: true });
  assert.equal(failedStorage.classes.has('mao-home-intro-active'), true);
  failedStorage.timers[0].callback();
  assert.equal(failedStorage.classes.has('mao-home-intro-active'), false);
  assert.equal(failedStorage.overlay.removed, true);
});
