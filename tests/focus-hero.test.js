import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Our Focus has an actual optimized agriculture hero asset committed in the repository', async () => {
  const img = new URL('../assets/img/focus-farming-hero.avif', import.meta.url);
  const metadata = await stat(img);
  const bytes = await readFile(img);
  assert.ok(metadata.size > 5000 && metadata.size < 200000, 'Hero should be present and light for mobile');
  assert.equal(bytes.subarray(4,12).toString('ascii'), 'ftypavif');
});

test('Focus hero uses photo with a dark green gradient and mobile readability overlay', async () => {
  const css = await read('assets/css/pages.css');
  assert.ok(css.includes('.mao-page-hero--focus{background:linear-gradient'));
  assert.ok(css.includes("url('../img/focus-farming-hero.avif') center 48%/cover no-repeat"));
  assert.ok(css.includes('background-color:#112b20'));
  assert.ok(css.includes('@media(max-width:700px){.mao-page-hero--focus{background-image:linear-gradient'));
  assert.ok(css.includes('background-position:center,64% center'));
  assert.ok(css.includes("url('../img/founders-meeting.jpg')"), 'other hero pages remain untouched');
});

test('Focus page preloads hero asset without changing actual content or navigation', async () => {
  const focus = await read('focus/index.html');
  assert.ok(focus.includes('<link rel="preload" href="/assets/img/focus-farming-hero.avif" as="image" type="image/avif">'));
  assert.ok(focus.includes('href="/assets/css/pages.css?v=focus-farming-photo-1"'));
  assert.ok(focus.includes('data-i18n="focusTitlePrefix">Pathways to '));
  assert.ok(focus.includes('data-i18n="focusTitleAccent">productive farming'));
  assert.ok(focus.includes('data-i18n="focusPageLead"'));
  assert.ok(focus.includes('id="mao-home-intro"'), 'keep logo intro');
  for (const path of ['about/index.html', 'updates/index.html', 'contact/index.html', 'donate/index.html']) {
    const html = await read(path);
    assert.ok(!html.includes('focus-farming-hero.avif'), 'photo is scoped to Focus only: ' + path);
  }
});
