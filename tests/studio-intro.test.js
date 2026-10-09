import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

function simulate(script, opts = {}) {
  const storage = opts.storage ?? new Map();
  const classes = new Set();
  const handlers = new Map();
  const timers = [];
  const intro = {
    id: 'mao-studio-intro',
    removed: false,
    remove() { this.removed = true; }
  };
  const document = {
    documentElement: { classList: {
      add(value) { classes.add(value); },
      remove(value) { classes.delete(value); }
    }},
    getElementById(id) { return id === intro.id ? intro : null; },
    addEventListener(event, handler) { handlers.set(event, handler); }
  };
  const window = {
    matchMedia() { return { matches: Boolean(opts.reducedMotion) }; },
    sessionStorage: {
      getItem(key) {
        if (opts.blockStorage) throw new Error('Storage disabled');
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        if (opts.blockStorage) throw new Error('Storage disabled');
        storage.set(key, value);
      }
    },
    setTimeout(callback, ms) { timers.push({ callback, ms }); }
  };
  runInNewContext(script, { document, window });
  return { storage, classes, intro, handlers, timers };
}

test('Admin introduction is only MAo emblem and Studio, never a second sidebar or a public page splash', async () => {
  const admin = await read('admin/index.html');
  const overlay = admin.match(/<div id="mao-studio-intro" class="mao-studio-intro" aria-hidden="true">([\s\S]*?)<\/div><\/div>/);
  assert.ok(overlay);
  assert.ok(overlay[1].includes('<img src="/assets/img/mao-logo.png"'));
  assert.ok(overlay[1].includes('<strong>Studio</strong>'));
  assert.ok(!overlay[1].includes('Mkulima Agricultural Organization'));
  assert.ok(!overlay[1].includes('MAo</strong>'));
  assert.ok(admin.indexOf('<script src="/assets/js/studio-intro.js?v=1"></script>') < admin.indexOf('<body>'));
  assert.ok(admin.includes('href="/assets/css/admin.css?v=editor-drafts-1"'));
  assert.ok(admin.includes('id="admin-workspace"'));
  assert.ok(admin.includes('id="write-update-link"'));
  assert.ok(admin.includes('class="brand-wordmark__studio">Studio</strong>'));
  const home = await read('index.html');
  assert.ok(!home.includes('id="mao-studio-intro"'));
  assert.ok(home.includes('id="mao-home-intro"'));
});

test('CMS intro CSS centers branded content with fade, mobile scaling and reduced-motion escape', async () => {
  const css = await read('assets/css/admin.css');
  assert.ok(css.includes('.mao-studio-intro{display:none;position:fixed;inset:0;z-index:9999;align-items:center;justify-content:center'));
  assert.ok(css.includes('.mao-studio-intro__brand{display:flex;align-items:center;justify-content:center'));
  assert.ok(css.includes("font-family:'Libre Caslon Condensed',Georgia,serif"));
  assert.ok(css.includes('@keyframes mao-studio-intro-brand'));
  assert.ok(css.includes('@keyframes mao-studio-intro-curtain'));
  assert.ok(css.includes('100%{opacity:0;visibility:hidden}'));
  assert.ok(css.includes('@media(prefers-reduced-motion:reduce){html.mao-studio-intro-active .mao-studio-intro{display:none!important}'));
});

test('Studio intro displays once per session, ends on outer animation and has a timeout failsafe', async () => {
  const script = await read('assets/js/studio-intro.js');
  const storage = new Map();
  const first = simulate(script, { storage });
  assert.equal(first.classes.has('mao-studio-intro-active'), true);
  assert.equal(storage.get('mao-studio-logo-intro-shown'), '1');
  assert.equal(first.timers.length, 1);
  assert.equal(first.timers[0].ms, 1600);
  first.handlers.get('animationend')({ target: { id: 'child' } });
  assert.equal(first.classes.has('mao-studio-intro-active'), true);
  first.handlers.get('animationend')({ target: first.intro });
  assert.equal(first.classes.has('mao-studio-intro-active'), false);
  assert.equal(first.intro.removed, true);
  const repeat = simulate(script, { storage });
  assert.equal(repeat.classes.has('mao-studio-intro-active'), false);
  assert.equal(repeat.timers.length, 0);
});

test('Studio intro skips reduced-motion setting and cannot block CMS if storage or animation fails', async () => {
  const script = await read('assets/js/studio-intro.js');
  const reduce = simulate(script, { reducedMotion: true });
  assert.equal(reduce.classes.has('mao-studio-intro-active'), false);
  assert.equal(reduce.timers.length, 0);
  assert.equal(reduce.storage.size, 0);
  const noStorage = simulate(script, { blockStorage: true });
  assert.equal(noStorage.classes.has('mao-studio-intro-active'), true);
  noStorage.timers[0].callback();
  assert.equal(noStorage.classes.has('mao-studio-intro-active'), false);
  assert.equal(noStorage.intro.removed, true);
});
