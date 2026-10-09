import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const text = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');
const addresses = [
  'info@mkulimaagricultural.org',
  'help@mkulimaagricultural.org',
  'donation@mkulimaagricultural.org',
  'ben@mkulimaagricultural.org'
];

test('all four MAO business emails appear as clickable addresses on Contact', async () => {
  const html = await text('contact/index.html');
  for (const address of addresses) {
    assert.ok(html.includes('href="mailto:' + address + '"'), address);
    assert.ok(html.includes('>' + address + '</a>'), address);
  }
  assert.match(html, /data-i18n="contactEmailGeneral"/);
  assert.match(html, /data-i18n="contactEmailSupport"/);
  assert.match(html, /data-i18n="contactEmailDonations"/);
  assert.match(html, /data-i18n="contactEmailBen"/);
});

test('homepage promotes business contact emails and Donate shows donation address', async () => {
  const home = await text('index.html');
  const donate = await text('donate/index.html');
  for (const email of addresses.slice(0,2)) assert.ok(home.includes('mailto:' + email));
  assert.ok(donate.includes('mailto:donation@mkulimaagricultural.org'));
});

test('former Gmail address is absent from Home and Contact but remains on Donate', async () => {
  const home = await text('index.html');
  const contact = await text('contact/index.html');
  const donate = await text('donate/index.html');
  assert.ok(!home.includes('mkulimaagricultural@gmail.com'));
  assert.ok(!contact.includes('mkulimaagricultural@gmail.com'));
  assert.ok(home.includes('href="mailto:info@mkulimaagricultural.org"'));
  assert.ok(home.includes('href="mailto:help@mkulimaagricultural.org"'));
  assert.ok(home.includes('P.O. Box 149, Mbeya, Tanzania'));
  assert.ok(donate.includes('href="mailto:mkulimaagricultural@gmail.com"'));
});

test('business email labels remain bilingual', async () => {
  const script = await text('assets/js/language.js');
  const english = script.indexOf('contactEmailGeneral: \'General enquiries\'');
  const swahili = script.indexOf('contactEmailGeneral: \'Maswali ya jumla\'');
  assert.ok(english >= 0);
  assert.ok(swahili > english);
});

test('Contact email directory has semantic rows, wide card, responsive spacing and refreshed stylesheet', async () => {
  const html = await text('contact/index.html');
  const css = await text('assets/css/pages.css');
  assert.ok(html.includes('class="mao-contact-card mao-contact-card--emails'));
  assert.ok(html.includes('<dl class="mao-contact-email-list">'));
  assert.ok(html.includes('href="/assets/css/pages.css?v=contact-hero-1"'));
  assert.equal(html.split('class="mao-contact-email-item').length - 1, 4);
  for (const address of addresses) {
    assert.ok(html.includes('<dd><a href="mailto:' + address + '">' + address + '</a></dd>'), address);
  }
  assert.ok(css.includes('.mao-contact-card--emails{grid-column:1/-1'));
  assert.ok(css.includes('.mao-contact-email-item dt{display:block'));
  assert.ok(css.includes('.mao-contact-email-item dd{display:block'));
  assert.ok(css.includes('.mao-contact-email-item a{display:block'));
  assert.ok(css.includes('@media(max-width:650px){.mao-contact-email-list{grid-template-columns:minmax(0,1fr)'));
});
