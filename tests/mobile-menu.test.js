import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');
const pages = [
  'index.html', 'about/index.html', 'focus/index.html',
  'updates/index.html', 'contact/index.html', 'donate/index.html'
];

test('mobile menu stacks outlined Donate above blue Contact button on all public pages', async () => {
  for (const path of pages) {
    const html = await read(path);
    const start = html.indexOf('<div class="mao-mobile-nav-actions"');
    assert.ok(start > 0, 'mobile button group missing: ' + path);
    const end = html.indexOf('</div>', start);
    const mobile = html.slice(start, end + 6);
    assert.equal((html.match(/class="mao-mobile-nav-actions"/g) || []).length, 1, path);
    const donate = mobile.indexOf('href="/donate/" class="nav__donate mao-mobile-action mao-mobile-action--outline"');
    const contact = mobile.indexOf('href="/contact/" class="nav__cta mao-mobile-action mao-mobile-action--primary"');
    assert.ok(donate >= 0 && contact > donate, 'Donate above Contact: ' + path);
    assert.ok(mobile.includes('<span data-i18n="navDonate">Donate</span>'), path);
    assert.ok(mobile.includes('<span data-i18n="navContact">Contact us</span>'), path);
    assert.ok(mobile.includes('class="nav__donate-icon"'), 'preserve requested Donate heart: ' + path);
    assert.ok(html.includes('mao.css?v=mobile-all-buttons-2'), 'cache-bust missing: ' + path);
    assert.ok(html.includes('class="mao-language-control"'), 'preserve language switch: ' + path);
    assert.ok(html.includes('class="nav__toggle"'), 'preserve menu toggle: ' + path);
  }
});

test('desktop navigation remains unchanged while mobile CTA duplicates are hidden outside narrow screens', async () => {
  const home = await read('index.html');
  const mobileIndex = home.indexOf('class="mao-mobile-nav-actions"');
  const contactIndex = home.indexOf('href="/contact/" class="nav__link"');
  const donateIndex = home.indexOf('href="/donate/" class="nav__donate"');
  assert.ok(contactIndex > 0 && contactIndex < donateIndex && donateIndex < mobileIndex,
    'desktop keeps existing Contact then Donate menu order');
  const css = await read('assets/css/mao.css');
  assert.ok(css.includes('.mao-mobile-nav-actions{display:none}'),
    'mobile duplicates must not display on desktop');
  assert.ok(css.includes('@media(max-width:768px){'));
  assert.ok(css.includes('.mao-mobile-nav-actions{\n    display:grid;'));
  assert.ok(css.includes('grid-template-columns:minmax(0,1fr)'));
  assert.ok(css.includes('.nav__links > .nav__link[data-i18n="navContact"]'));
  assert.ok(css.includes('.nav__links > .nav__donate{display:none}'));
  assert.ok(css.includes('.mao-mobile-action--outline'));
  assert.ok(css.includes('border:2px solid #1968c7;background:transparent;color:#fff'));
  assert.ok(css.includes('.mao-mobile-action--primary'));
  assert.ok(css.includes('linear-gradient(110deg,#0864c9,#04afe2)'));
  assert.ok(css.includes('min-height:68px'));
  assert.ok(css.includes('.nav:has(.nav__links--open) .mao-language-control{visibility:hidden;pointer-events:none}'));
});

test('About, Our Focus and Updates match the mobile outline buttons, without active underline', async () => {
  const css = await read('assets/css/mao.css');
  const mobileRules = css.slice(css.indexOf('/* Mobile navigation: stacked call-to-action buttons'));
  assert.ok(mobileRules.includes('gap:1rem;overflow-y:auto;overscroll-behavior:contain'),
    'nav uses the same vertical spacing between all five links');
  assert.match(mobileRules, /\.nav__links > \.nav__link\{[\s\S]*?display:flex;align-items:center;justify-content:center;[\s\S]*?width:100%;min-height:68px;[\s\S]*?border:2px solid #1968c7;border-radius:1\.05rem;/);
  assert.ok(mobileRules.includes('color:#fff!important;'), 'mobile link text stays readable on dark background');
  assert.ok(mobileRules.includes('.nav__links > .nav__link::after{display:none!important}'),
    'old active underline must not appear');
  assert.ok(mobileRules.includes('border-color:#4aa3ff;'),
    'active page has a highlighted blue border');
  assert.ok(mobileRules.includes('width:100%;margin-top:0;padding-top:0'),
    'Donate and Contact should follow the other buttons without a large empty gap');
  assert.ok(mobileRules.includes('@media(max-width:350px)'),
    'compact screen layout must stay usable');
  for (const path of pages) {
    const html = await read(path);
    const links = ['/about/', '/focus/', '/updates/'].map(route => html.indexOf('href="' + route + '" class="nav__link'));
    assert.ok(links.every(index => index >= 0) && links[0] < links[1] && links[1] < links[2],
      'preserve navigation order on ' + path);
  }
});

test('mobile action buttons close sidebar on click and keep both translation labels', async () => {
  const js = await read('assets/js/main.js');
  const language = await read('assets/js/language.js');
  assert.ok(js.includes(".nav__link, .nav__cta, .nav__donate"));
  assert.ok(language.includes("navContact: 'Wasiliana nasi'"));
  assert.ok(language.includes("navDonate: 'Changia'"));
});
