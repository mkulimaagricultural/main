import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const pagePaths = [
  'index.html', 'about/index.html', 'focus/index.html',
  'updates/index.html', 'contact/index.html', 'donate/index.html'
];
const text = (path) => readFile(new URL('../' + path, import.meta.url), 'utf8');

test('all six public pages use the same branded dropdown instead of a device-native language select', async () => {
  for (const path of pagePaths) {
    const source = await text(path);
    assert.match(source, /id="language-select" class="mao-language-trigger" type="button"/, path);
    assert.match(source, /id="mao-language-menu" class="mao-language-menu" role="group"[^>]* hidden>/, path);
    assert.match(source, /data-language="en" aria-pressed="true"/, path);
    assert.match(source, /data-language="sw" aria-pressed="false"/, path);
    assert.ok(!source.includes('<select id="language-select"'), path);
    assert.ok(source.includes('mao.css?v=' + (path === 'index.html' ? 'home-intro-1' : 'public-logo-intro-2')), path);
    assert.ok(source.includes('language.js?v=lang-dropdown-1'), path);
  }
});

test('custom menu has protected hidden state, desktop positioning, mobile sizing and keyboard focus', async () => {
  const css = await text('assets/css/mao.css');
  assert.match(css, /\.mao-language-menu\[hidden\]\{display:none!important\}/);
  assert.match(css, /\.mao-language-menu\{position:absolute;/);
  assert.match(css, /\.mao-language-option:focus-visible/);
  assert.match(css, /\.mao-language-trigger:focus-visible/);
  assert.match(css, /\.mao-language-trigger\{min-width:105px\}/);
  assert.ok(!css.includes('.mao-language-select'));
});

function simulateLanguageMenu(savedLanguage = 'en') {
  const elements = {};
  const callbacks = {};
  const storage = new Map([['mao-language', savedLanguage]]);
  const events = [];
  const document = {
    documentElement: { lang: 'en' },
    activeElement: null,
    getElementById(id) { return elements[id] || null; },
    querySelector(selector) {
      if (selector === 'meta[name="description"]') return elements.meta;
      return null;
    },
    querySelectorAll(selector) {
      if (selector === '[data-i18n]') return [elements.translatable];
      if (selector === '[data-i18n-aria]') return [elements.picker, elements.dropdown];
      return [];
    },
    addEventListener(type, listener) { callbacks['document:' + type] = listener; }
  };
  const node = (id, attrs = {}) => {
    const listeners = {};
    const attributes = { ...attrs };
    return {
      id, dataset: {}, hidden: false, textContent: '',
      listeners,
      addEventListener(type, listener) { listeners[type] = listener; },
      setAttribute(key, value) { attributes[key] = value; },
      getAttribute(key) { return attributes[key] ?? null; },
      focus() { document.activeElement = this; }
    };
  };
  const control = { contains(element) { return [elements.picker, elements.dropdown, ...elements.options].includes(element); } };
  elements.value = node('value');
  elements.picker = node('language-select', { 'aria-expanded': 'false' });
  elements.picker.dataset.i18nAria = 'languageLabel';
  elements.picker.closest = () => control;
  elements.picker.querySelector = () => elements.value;
  elements.dropdown = node('mao-language-menu');
  elements.dropdown.hidden = true;
  elements.dropdown.dataset.i18nAria = 'languageLabel';
  elements.options = ['en','sw'].map((language) => {
    const option = node(language);
    option.dataset.language = language;
    return option;
  });
  elements.dropdown.querySelectorAll = () => elements.options;
  elements.translatable = node('nav-title');
  elements.translatable.dataset.i18n = 'navAbout';
  elements.meta = { dataset: { i18nMeta: 'metaDescription' }, content: '' };
  elements['language-select'] = elements.picker;
  elements['mao-language-menu'] = elements.dropdown;

  const window = {
    addEventListener(type, callback) { callbacks['window:' + type] = callback; },
    dispatchEvent(event) { events.push(event); }
  };
  const localStorage = {
    getItem(key) { return storage.get(key) || null; },
    setItem(key, value) { storage.set(key, value); }
  };
  class CustomEvent {
    constructor(type, options) { this.type = type; this.detail = options.detail; }
  }
  return { elements, callbacks, events, storage, document, window, localStorage, CustomEvent };
}

test('opens in-page, selects Kiswahili, saves preference, and closes on outside click and Escape', async () => {
  const source = await text('assets/js/language.js');
  const mock = simulateLanguageMenu();
  runInNewContext(source, mock);
  const { picker, dropdown, options, value, translatable } = mock.elements;
  assert.equal(value.textContent, 'English');
  assert.equal(translatable.textContent, 'About us');
  assert.equal(dropdown.hidden, true);

  picker.listeners.click();
  assert.equal(dropdown.hidden, false);
  assert.equal(picker.getAttribute('aria-expanded'), 'true');
  assert.equal(mock.document.activeElement, options[0]);
  options[1].listeners.click();
  assert.equal(mock.document.documentElement.lang, 'sw');
  assert.equal(value.textContent, 'Kiswahili');
  assert.equal(translatable.textContent, 'Kuhusu sisi');
  assert.equal(mock.storage.get('mao-language'), 'sw');
  assert.equal(dropdown.hidden, true);
  assert.equal(picker.getAttribute('aria-expanded'), 'false');
  assert.equal(options[1].getAttribute('aria-pressed'), 'true');
  assert.equal(options[0].getAttribute('aria-pressed'), 'false');

  picker.listeners.click();
  mock.callbacks['document:click']({ target: { id: 'outside' } });
  assert.equal(dropdown.hidden, true);

  picker.listeners.click();
  let prevented = false;
  options[1].listeners.keydown({ key:'Escape', preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(dropdown.hidden, true);
  assert.equal(mock.document.activeElement, picker);

  const nextPage = simulateLanguageMenu(mock.storage.get('mao-language'));
  runInNewContext(source, nextPage);
  assert.equal(nextPage.document.documentElement.lang, 'sw');
  assert.equal(nextPage.elements.value.textContent, 'Kiswahili');
});

test('keyboard supports ArrowDown, ArrowUp, Home, End and closes on scroll', async () => {
  const source = await text('assets/js/language.js');
  const mock = simulateLanguageMenu();
  runInNewContext(source, mock);
  const { picker, dropdown, options } = mock.elements;
  let preventCount = 0;
  picker.listeners.keydown({ key:'ArrowDown', preventDefault() { preventCount++; } });
  assert.equal(dropdown.hidden, false);
  assert.equal(mock.document.activeElement, options[0]);
  options[0].listeners.keydown({ key:'ArrowDown', preventDefault() { preventCount++; } });
  assert.equal(mock.document.activeElement, options[1]);
  options[1].listeners.keydown({ key:'Home', preventDefault() { preventCount++; } });
  assert.equal(mock.document.activeElement, options[0]);
  options[0].listeners.keydown({ key:'End', preventDefault() { preventCount++; } });
  assert.equal(mock.document.activeElement, options[1]);
  assert.equal(preventCount, 4);
  mock.callbacks['window:scroll']();
  assert.equal(dropdown.hidden, true);
  assert.equal(picker.getAttribute('aria-expanded'), 'false');
});
