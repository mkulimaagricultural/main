import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';

const read = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('Contact uses a committed optimized AVIF image, not a plain gradient', async () => {
  const file = new URL('../assets/img/mao-contact-hero.avif', import.meta.url);
  const info = await stat(file);
  const data = await readFile(file);
  assert.ok(info.size > 30000 && info.size < 180000, 'Contact photo should be detailed but lightweight');
  assert.equal(data.subarray(4, 12).toString('ascii'), 'ftypavif');
  const css = await read('assets/css/pages.css');
  assert.ok(css.includes(".mao-page-hero--contact{background:linear-gradient"));
  assert.ok(css.includes("url('../img/mao-contact-hero.avif?v=1')"));
  assert.ok(css.includes('background-color:#112b20'));
  assert.ok(css.includes('@media(max-width:700px){.mao-page-hero--contact{background-image:linear-gradient'));
});

test('Donate shows the existing real farming photograph behind its unchanged heading', async () => {
  const file = new URL('../assets/img/hero-farm.jpg', import.meta.url);
  const info = await stat(file);
  assert.ok(info.size > 40000);
  const css = await read('assets/css/donate.css');
  assert.ok(css.includes('.mao-page-hero--donate {'));
  assert.ok(css.includes("url('../img/hero-farm.jpg') center 52% / cover no-repeat"));
  assert.ok(css.includes('.mao-page-hero--donate { background-image: linear-gradient'));
  assert.ok(css.includes('background-color: #112b20'));
});

test('Contact and Donate preload photo assets while keeping forms, bank details, i18n and logo intros untouched', async () => {
  const contact = await read('contact/index.html');
  const donate = await read('donate/index.html');
  assert.ok(contact.includes('<link rel="preload" href="/assets/img/mao-contact-hero.avif?v=1" as="image" type="image/avif">'));
  assert.ok(contact.includes('href="/assets/css/pages.css?v=contact-hero-1"'));
  assert.ok(contact.includes('class="mao-page-hero mao-page-hero--contact"'));
  assert.ok(contact.includes('data-i18n="contactTitle"'));
  assert.ok(contact.includes('mailto:info@mkulimaagricultural.org'));
  assert.ok(contact.includes('mailto:donation@mkulimaagricultural.org'));
  assert.ok(donate.includes('<link rel="preload" href="/assets/img/hero-farm.jpg" as="image" type="image/jpeg">'));
  assert.ok(donate.includes('href="/assets/css/donate.css?v=donate-hero-1"'));
  assert.ok(donate.includes('class="mao-page-hero mao-page-hero--donate"'));
  assert.ok(donate.includes('data-i18n="donateTitle"'));
  assert.ok(donate.includes('donateAccountNumberLabel'));
  assert.ok(donate.includes('donation@mkulimaagricultural.org'));
  assert.ok(contact.includes('id="mao-home-intro"'));
  assert.ok(donate.includes('id="mao-home-intro"'));
});
