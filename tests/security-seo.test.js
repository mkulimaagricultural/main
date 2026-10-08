import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { HSTS, CSP_REPORT_ONLY, secureResponse } from '../lib/security.js';
import { onRequest as rootMiddleware } from '../functions/_middleware.js';
import { onRequestGet as articleGet } from '../functions/updates/[id].js';

const ROOT = 'https://www.mkulimaagricultural.org';
const pages = new Map([
  ['index.html', '/'], ['about/index.html', '/about/'], ['focus/index.html', '/focus/'],
  ['updates/index.html', '/updates/'], ['contact/index.html', '/contact/'],
  ['donate/index.html', '/donate/']
]);

test('all six public pages publish matching self-canonicals and complete Open Graph tags', async () => {
  for (const [path, urlPath] of pages) {
    const html = await readFile(new URL('../' + path, import.meta.url), 'utf8');
    assert.ok(html.includes('<link rel="canonical" href="' + ROOT + urlPath + '">'), path);
    assert.ok(html.includes('<meta property="og:url" content="' + ROOT + urlPath + '">'), path);
    for (const name of ['og:type', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:image']) {
      assert.ok(html.includes('property="' + name + '"'), path + ' missing ' + name);
    }
    assert.ok(html.includes('name="twitter:card" content="summary_large_image"'), path);
    assert.equal((html.match(/rel="canonical"/g) || []).length, 1, path);
  }
  const admin = await readFile(new URL('../admin/index.html', import.meta.url), 'utf8');
  assert.ok(admin.includes('name="robots" content="noindex,nofollow"'));
  assert.ok(!admin.includes('rel="canonical"'));
});

test('static headers enforce clickjacking and HSTS but use report-only script CSP', async () => {
  const contents = await readFile(new URL('../_headers', import.meta.url), 'utf8');
  assert.match(contents, /X-Frame-Options: DENY/);
  assert.match(contents, /Content-Security-Policy: frame-ancestors 'none'/);
  assert.match(contents, /Content-Security-Policy-Report-Only: default-src 'self'/);
  assert.match(contents, /https:\/\/www\.mkulimaagricultural\.org\/\*/);
  assert.match(contents, /Strict-Transport-Security: max-age=15552000/);
  const hstsHeaderLines = contents.split('\\n').filter(line => line.trimStart().startsWith('Strict-Transport-Security:'));
  assert.ok(hstsHeaderLines.length > 0);
  assert.ok(hstsHeaderLines.every(line => !line.includes('includeSubDomains') && !line.includes('preload')));
  const build = await readFile(new URL('../scripts/build.mjs', import.meta.url), 'utf8');
  assert.match(build, /'_headers'/);
});

test('Cloudflare Function middleware preserves status, body, and original cookies and limits HSTS hosts', async () => {
  const input = new Response('ok', { status: 202, headers: {
    'Set-Cookie': 'session=abc; HttpOnly',
    'Cache-Control': 'private',
    'Content-Type': 'text/plain'
  } });
  const result = secureResponse(input, ROOT + '/updates/example');
  assert.equal(result.status, 202);
  assert.equal(result.headers.get('Set-Cookie'), 'session=abc; HttpOnly');
  assert.equal(result.headers.get('Cache-Control'), 'private');
  assert.equal(result.headers.get('Content-Security-Policy'), "frame-ancestors 'none'");
  assert.equal(result.headers.get('Content-Security-Policy-Report-Only'), CSP_REPORT_ONLY);
  assert.equal(result.headers.get('Strict-Transport-Security'), HSTS);
  assert.equal(result.headers.get('X-Frame-Options'), 'DENY');
  assert.equal(await result.text(), 'ok');

  for (const url of ['http://www.mkulimaagricultural.org/', 'https://random.pages.dev/', 'https://untrusted.test/']) {
    assert.equal(secureResponse(new Response('ok'), url).headers.get('Strict-Transport-Security'), null);
  }

  const response = await rootMiddleware({ next: async () => new Response('safe'), request: new Request(ROOT + '/api/posts') });
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY');
});

function db(post, media = []) {
  return { prepare(sql) {
    return { bind() {
      if (sql.includes('SELECT p.id')) return { first: async () => post };
      if (sql.includes('FROM post_media')) return { all: async () => ({
        results: media.map((item, index) => ({ post_id: post.id, media_url: item.url, media_type: item.type, position: index }))
      }) };
      return { run: async () => ({ success: true }) };
    } };
  } };
}

test('live article renders escaped OG data, canonical URL, and actual first image', async () => {
  const post = {
    id: 'test-article-01', title_en: 'A & B <news>', title_sw: 'Habari & Zao',
    body_en: 'Farmers & researchers shared some findings.',
    body_sw: 'Wakulima & watafiti waliwasilisha ripoti.',
    image_url: '', published_at: '2026-10-08T10:00:00Z'
  };
  const firstImage = '/api/media/12345678-1234-1234-1234-123456789abc.jpg';
  const result = await articleGet({
    params: { id: post.id },
    request: new Request(ROOT + '/updates/' + post.id),
    env: { DB: db(post, [{url:'/api/media/abcdef12-1234-1234-1234-123456789abc.mp4',type:'video'},{url:firstImage,type:'image'}]) }
  });
  assert.equal(result.status, 200);
  const html = await result.text();
  assert.ok(html.includes('<link rel="canonical" href="' + ROOT + '/updates/test-article-01">'));
  assert.ok(html.includes('<meta property="og:type" content="article">'));
  assert.ok(html.includes('<meta property="og:title" content="A &amp; B &lt;news&gt; | MAo">'));
  assert.ok(html.includes('<meta property="og:image" content="' + ROOT + firstImage + '">'));
  assert.ok(html.includes('<meta name="twitter:card" content="summary_large_image">'));
  assert.equal((html.match(/rel="canonical"/g)||[]).length, 1);
  assert.ok(!html.includes('content="A & B <news>'));
});
