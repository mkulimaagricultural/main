import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildSitemap, onRequestGet } from '../functions/sitemap.xml.js';

const base = 'https://www.mkulimaagricultural.org';
const expectedPaths = ['/', '/about/', '/focus/', '/updates/', '/contact/', '/donate/', '/app/'];

test('committed sitemap contains seven public pages and the initial published article', async () => {
  const xml = await readFile(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.match(xml, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  for (const path of expectedPaths) assert.ok(xml.includes('<loc>' + base + path + '</loc>'));
  assert.ok(xml.includes('<loc>' + base + '/updates/mao-founders-meeting-001</loc>'));
  assert.equal((xml.match(/<url>/g) || []).length, 8);
  assert.ok(!xml.includes('/admin/'));
});

test('dynamic sitemap emits pages, published articles and real lastmod, no unsafe IDs', () => {
  const xml = buildSitemap([
    { id: 'first-post', updated_at: '2026-10-08 18:00:00' },
    { id: 'second-post', updated_at: '2026-10-09T01:02:03.000Z' },
    { id: 'first-post', updated_at: '2026-10-09T01:02:03.000Z' },
    { id: '../admin', updated_at: '2026-10-09' },
    { id: 'invalid&evil', updated_at: '' }
  ]);
  assert.ok(xml.includes('<loc>' + base + '/updates/first-post</loc><lastmod>2026-10-08T18:00:00.000Z</lastmod>'));
  assert.ok(xml.includes('<loc>' + base + '/updates/second-post</loc><lastmod>2026-10-09T01:02:03.000Z</lastmod>'));
  assert.equal((xml.match(/<url>/g) || []).length, 9);
  assert.ok(!xml.includes('invalid&amp;evil'));
  assert.ok(!xml.includes('/admin'));
});

test('live endpoint queries only published non-trashed articles and returns XML', async () => {
  let sql = '';
  const env = { DB: { prepare(query) {
    sql = query;
    return { all: async () => ({ results: [
      { id: 'mao-founders-meeting-001', updated_at: '2026-10-08 18:01:00' }
    ] }) };
  } } };
  const response = await onRequestGet({ env });
  assert.equal(response.status, 200);
  assert.match(response.headers.get('Content-Type'), /application\/xml/);
  assert.ok(response.headers.get('Cache-Control').includes('max-age=300'));
  assert.match(sql, /p\.status = 'published'/);
  assert.match(sql, /m\.deleted_at IS NOT NULL/);
  assert.match(await response.text(), /updates\/mao-founders-meeting-001/);
});

test('fallback supports older databases and fails closed if database is unavailable', async () => {
  let count = 0;
  const env = { DB: { prepare(query) {
    count++;
    if (count === 1) throw new Error('no such table: post_meta');
    assert.match(query, /WHERE status = 'published'/);
    return { all: async () => ({ results: [{ id: 'legacy-article', updated_at: '' }] }) };
  } } };
  const response = await onRequestGet({ env });
  assert.equal(response.status, 200);
  assert.match(await response.text(), /updates\/legacy-article/);
  assert.equal((await onRequestGet({ env: {} })).status, 503);
  const bad = await onRequestGet({ env: { DB: { prepare() { throw Error('D1 error'); } } } });
  assert.equal(bad.status, 503);
});

test('Pages build and routing include the sitemap and robots discovery', async () => {
  const routes = JSON.parse(await readFile(new URL('../_routes.json', import.meta.url), 'utf8'));
  const build = await readFile(new URL('../scripts/build.mjs', import.meta.url), 'utf8');
  const robots = await readFile(new URL('../robots.txt', import.meta.url), 'utf8');
  assert.ok(routes.include.includes('/sitemap.xml'));
  assert.match(build, /'sitemap\.xml', 'robots\.txt'/);
  assert.match(robots, /Sitemap: https:\/\/www\.mkulimaagricultural\.org\/sitemap\.xml/);
});
