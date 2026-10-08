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
    location: { pathname: options.pathname ?? '/' },
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

test('all six public pages show only the MAo logo, with intro script before body and no extra text', async () => {
  const routes = [
    ['index.html', 'assets/img/mao-logo.png', 'home-intro-1'],
    ['about/index.html', '/assets/img/mao-logo.png', 'public-logo-intro-2'],
    ['focus/index.html', '/assets/img/mao-logo.png', 'public-logo-intro-2'],
    ['updates/index.html', '/assets/img/mao-logo.png', 'public-logo-intro-2'],
    ['contact/index.html', '/assets/img/mao-logo.png', 'public-logo-intro-2'],
    ['donate/index.html', '/assets/img/mao-logo.png', 'public-logo-intro-2']
  ];
  for (const [path, imageSrc, cssVersion] of routes) {
    const html = await read(path);
    const markup = html.match(/<div id="mao-home-intro" class="mao-home-intro" aria-hidden="true">([\s\S]*?)<\/div>/);
    assert.ok(markup, 'intro overlay missing on ' + path);
    assert.equal((html.match(/id="mao-home-intro"/g) || []).length, 1, path);
    assert.ok(markup[1].includes('<img src="' + imageSrc + '" alt=""'), path);
    assert.ok(!/<(?:h[1-6]|p|span|a|button)\b/.test(markup[1]), path);
    assert.ok(html.includes('mao.css?v=' + cssVersion), path);
    assert.ok(html.includes('home-intro.js?v=2'), path);
    assert.ok(html.includes('rel="preload" as="image"'), path);
    assert.ok(html.indexOf('home-intro.js?v=2') < html.indexOf('<body'), path);
  }
  const home = await read('index.html');
  assert.ok(home.includes('<script src="assets/js/home-intro.js?v=2"></script>'));
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


test('separate pages each animate only once, sharing the same tab session without reset', async () => {
  const script = await read('assets/js/home-intro.js');
  const storage = new Map();
  const home = simulate(script, { pathname: '/', storage });
  assert.equal(home.classes.has('mao-home-intro-active'), true);
  home.timers[0].callback();

  const about = simulate(script, { pathname: '/about/', storage });
  assert.equal(about.classes.has('mao-home-intro-active'), true);
  assert.equal(storage.get('mao-home-logo-intro-shown:/about'), '1');
  about.timers[0].callback();

  const donate = simulate(script, { pathname: '/donate/', storage });
  assert.equal(donate.classes.has('mao-home-intro-active'), true);
  donate.timers[0].callback();

  const article = simulate(script, { pathname: '/updates/example-post', storage });
  assert.equal(article.classes.has('mao-home-intro-active'), true);
  assert.equal(storage.get('mao-home-logo-intro-shown:/updates/example-post'), '1');

  const aboutAgain = simulate(script, { pathname: '/about', storage });
  const homeAgain = simulate(script, { pathname: '/', storage });
  assert.equal(aboutAgain.classes.has('mao-home-intro-active'), false);
  assert.equal(homeAgain.classes.has('mao-home-intro-active'), false);
  assert.equal(aboutAgain.timers.length, 0);
  assert.equal(homeAgain.timers.length, 0);
});

test('published article pages include the same branded intro without altering article content', async () => {
  const { onRequestGet } = await import('../functions/updates/[id].js');
  const post = {
    id: 'test-article', title_en: 'MAo article', title_sw: 'Habari ya MAo',
    body_en: 'Article body', body_sw: 'Maelezo ya habari',
    image_url: '', published_at: '2026-10-08T12:00:00Z'
  };
  const DB = { prepare() { return { bind() { return {
    first: async () => post,
    all: async () => ({ results: [] }),
    run: async () => ({ success: true })
  }; } }; } };
  const response = await onRequestGet({
    env: { DB }, params: { id: post.id },
    request: new Request('https://www.mkulimaagricultural.org/updates/test-article')
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes('<script src="/assets/js/home-intro.js?v=2"></script>'));
  assert.ok(html.includes('href="/assets/css/mao.css?v=public-logo-intro-2"'));
  assert.ok(html.includes('<div id="mao-home-intro" class="mao-home-intro" aria-hidden="true"><img src="/assets/img/mao-logo.png" alt=""'));
  assert.ok(html.includes('<h1>MAo article</h1>'));
  assert.ok(html.includes('Article body'));
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
