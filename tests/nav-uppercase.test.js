import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const pages = [
  'index.html', 'about/index.html', 'focus/index.html',
  'updates/index.html', 'contact/index.html', 'donate/index.html'
];
const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('all six public pages render Contact as a regular navigation link and preserve Donate button styling', async () => {
  for (const path of pages) {
    const html = await read(path);
    const contact = html.match(/<a href="\/contact\/" class="([^"]+)" data-i18n="navContact">Contact us<\/a>/);
    assert.ok(contact, 'Contact link missing: ' + path);
    assert.ok(contact[1].split(' ').includes('nav__link'), 'Contact must match other nav links: ' + path);
    assert.ok(!contact[1].includes('nav__cta'), 'Contact must not be pill: ' + path);
    assert.equal(contact[1].includes('nav__link--active'), path === 'contact/index.html', path);
    assert.ok(html.includes('class="nav__donate'), 'Donate retains its pill: ' + path);
    for (const section of ['navAbout', 'navFocus', 'navUpdates', 'navContact', 'navDonate']) {
      assert.ok(html.includes('data-i18n="' + section + '"'), section + ' must remain bilingual in ' + path);
    }
    assert.ok(html.includes('mao.css?v=' + 'donate-heart-1'), 'updated CSS not loaded by ' + path);
  }
});


test('Donate pill has an accessible decorative heart icon across six pages, preserving language switching', async () => {
  for (const path of pages) {
    const html = await read(path);
    const link = html.match(/<a href="\/donate\/" class="(nav__donate(?: nav__donate--active)?)">([\s\S]*?)<\/a>/);
    assert.ok(link, 'Donate link missing: ' + path);
    assert.ok(link[2].includes('<svg class="nav__donate-icon"'), 'Heart icon absent: ' + path);
    assert.ok(link[2].includes('aria-hidden="true"'), 'Icon must be decorative: ' + path);
    assert.ok(link[2].includes('stroke="currentColor"'), 'Icon must inherit button color: ' + path);
    assert.ok(link[2].includes('<span data-i18n="navDonate">Donate</span>'), 'Translatable label absent: ' + path);
    assert.ok(!link[2].includes('<svg') || link[2].indexOf('<svg') < link[2].indexOf('<span'), 'Icon should precede label: ' + path);
    assert.equal(link[1].includes('nav__donate--active'), path === 'donate/index.html', path);
  }
  const css = await read('assets/css/mao.css');
  assert.ok(css.includes('.nav__donate{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;'));
  assert.ok(css.includes('.nav__donate-icon{display:block;flex:none;width:18px;height:18px;stroke:currentColor;pointer-events:none}'));
  const translations = await read('assets/js/language.js');
  assert.ok(translations.includes("navDonate: 'Donate'"));
  assert.ok(translations.includes("navDonate: 'Changia'"));
});
test('uppercase styling targets only public navigation labels, not language picker or CMS', async () => {
  const css = await read('assets/css/mao.css');
  assert.ok(css.includes('.nav__links > a{text-transform:uppercase;letter-spacing:.035em;white-space:nowrap}'));
  assert.ok(css.includes('.nav:not(.nav--scrolled) .nav__link{color:#fff}'));
  const js = await read('assets/js/main.js');
  assert.ok(js.includes(".nav__link, .nav__cta, .nav__donate"));
  const translations = await read('assets/js/language.js');
  assert.ok(translations.includes("navContact: 'Contact us'"));
  assert.ok(translations.includes("navContact: 'Wasiliana nasi'"));
});
