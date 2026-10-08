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
    assert.ok(html.includes('mao.css?v=nav-uppercase-1'), 'updated CSS not loaded by ' + path);
  }
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
