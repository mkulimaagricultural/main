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

test('existing contact email remains in all three public contact sections', async () => {
  for (const path of ['index.html', 'contact/index.html', 'donate/index.html']) {
    const html = await text(path);
    assert.ok(html.includes('href="mailto:mkulimaagricultural@gmail.com"'), path);
  }
});

test('business email labels remain bilingual', async () => {
  const script = await text('assets/js/language.js');
  const english = script.indexOf('contactEmailGeneral: \'General enquiries\'');
  const swahili = script.indexOf('contactEmailGeneral: \'Maswali ya jumla\'');
  assert.ok(english >= 0);
  assert.ok(swahili > english);
});
