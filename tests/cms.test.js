import test from 'node:test';
import assert from 'node:assert/strict';
import { generateKeyPairSync, createSign } from 'node:crypto';
import { getAdminRole, isSameOrigin } from '../lib/auth.js';
import { validatePost } from '../lib/posts.js';
import { onRequest as adminMiddleware } from '../functions/admin/_middleware.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'test-key', alg: 'RS256', use: 'sig' };
const originalFetch = globalThis.fetch;
globalThis.fetch = async () => Response.json({ keys: [jwk] });

function token(email, changes = {}) {
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: 'test-key' })).toString('base64url');
  const claims = {
    aud: ['mao-audience'], email, exp: Math.floor(Date.now() / 1000) + 600,
    iss: 'https://mao.cloudflareaccess.com', type: 'app', ...changes
  };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).end().sign(privateKey).toString('base64url');
  return `${header}.${payload}.${signature}`;
}

const env = {
  ACCESS_AUD: 'mao-audience', ACCESS_TEAM_DOMAIN: 'https://mao.cloudflareaccess.com',
  MAO_ADMIN_EMAILS: 'first@example.org,second@example.org'
};
const request = (jwt) => new Request('https://example.org/admin/api/posts', { headers: { 'CF-Access-Jwt-Assertion': jwt } });

test('signed Access tokens grant both listed emails identical admin rights', async () => {
  assert.deepEqual(await getAdminRole(request(token('first@example.org')), env), { role: 'admin', email: 'first@example.org' });
  assert.deepEqual(await getAdminRole(request(token('second@example.org')), env), { role: 'admin', email: 'second@example.org' });
});

test('missing, altered and wrong-audience tokens fail closed', async () => {
  assert.equal(await getAdminRole(new Request('https://example.org/admin/api/posts'), env), null);
  assert.equal(await getAdminRole(request(token('first@example.org').slice(0, -3) + 'xxx'), env), null);
  assert.equal(await getAdminRole(request(token('first@example.org', { aud: ['another-app'] })), env), null);
  assert.equal(await getAdminRole(request(token('unknown@example.org')), env), null);
  assert.equal(await getAdminRole(request(token('first@example.org')), { ...env, ACCESS_AUD: '' }), null);
});

test('writes require the same origin', () => {
  assert.equal(isSameOrigin(new Request('https://example.org/admin/api/posts', { headers: { Origin: 'https://example.org' } })), true);
  assert.equal(isSameOrigin(new Request('https://example.org/admin/api/posts', { headers: { Origin: 'https://evil.example' } })), false);
});

test('posts need both languages and a local image path', () => {
  const good = { title_en: 'News', title_sw: 'Habari', body_en: 'English text', body_sw: 'Maandishi', status: 'draft', image_url: '/assets/img/founders-meeting.jpg' };
  assert.ok(validatePost(good).post);
  assert.ok(validatePost({ ...good, body_sw: '' }).error);
  assert.ok(validatePost({ ...good, image_url: 'https://outside.example/tracker.jpg' }).error);
});

test('admin page and API are confined to the protected hostname', async () => {
  const context = { request: new Request('https://mkulimaagricultural.org/admin/api/posts'), env, data: {}, next: () => new Response('unsafe') };
  const apiResponse = await adminMiddleware(context);
  assert.equal(apiResponse.status, 403);
  context.request = new Request('https://mkulimaagricultural.org/admin/');
  const pageResponse = await adminMiddleware(context);
  assert.equal(pageResponse.status, 302);
  assert.equal(pageResponse.headers.get('Location'), 'https://admin.mkulimaagricultural.org/admin/');
  context.request = new Request('https://admin.mkulimaagricultural.org/admin/api/posts');
  assert.equal((await adminMiddleware(context)).status, 403);
  context.request = new Request('https://admin.mkulimaagricultural.org/admin/api/posts', { headers: { 'CF-Access-Jwt-Assertion': token('second@example.org') } });
  assert.equal((await adminMiddleware(context)).status, 200);
  assert.deepEqual(context.data.admin, { role: 'admin', email: 'second@example.org' });
});


test('sidebar Write an update link opens the same editor as New update', async () => {
  const { readFile } = await import('node:fs/promises');
  const page = await readFile(new URL('../admin/index.html', import.meta.url), 'utf8');
  const script = await readFile(new URL('../assets/js/admin.js', import.meta.url), 'utf8');
  assert.match(page, /id="write-update-link"\s+href="\/admin\/\?compose=1#editor-panel"/);
  assert.match(script, /function openNewPost\(event\)\s*\{/);
  assert.match(script, /event\?\.preventDefault\(\)/);
  assert.match(script, /panel\.hidden = false;/);
  assert.match(script, /getElementById\('new-post'\)\.addEventListener\('click', openNewPost\)/);
  assert.match(script, /getElementById\('write-update-link'\)\.addEventListener\('click', openNewPost\)/);
});


test('real sidebar and New update clicks open editor; deep link opens after load', async () => {
  const { readFile } = await import('node:fs/promises');
  const { runInNewContext } = await import('node:vm');
  const page = await readFile(new URL('../admin/index.html', import.meta.url), 'utf8');
  const script = await readFile(new URL('../assets/js/admin.js', import.meta.url), 'utf8');
  assert.match(page, /id="write-update-link" href="\/admin\/\?compose=1#editor-panel"/);
  assert.match(page, /admin\.js\?v=editor-drafts-1/);

  const simulate = async (search = '') => {
    const nodes = new Map();
    const element = (id) => {
      if (!nodes.has(id)) {
        nodes.set(id, {
          id, hidden: id === 'editor-panel', textContent: '', value: '', dataset: {},
          listeners: {},
          addEventListener(type, handler) { this.listeners[type] = handler; },
          replaceChildren() {},
          append() {},
          reset() {},
          scrollIntoView() { this.scrolled = true; }
        });
      }
      return nodes.get(id);
    };
    const form = element('post-form');
    form.elements = { namedItem: element };
    form.querySelector = () => element('submit-button');
    const context = {
      document: {
        getElementById: element,
        querySelectorAll: () => [],
        createElement: (tag) => element('created-' + tag)
      },
      window: { location: { search, hash: '' } },
      URLSearchParams,
      fetch: async () => ({ ok: true, json: async () => ({ posts: [], email: 'admin@example.org' }) })
    };
    runInNewContext(script, context);
    for (let i = 0; i < 12 && !element('admin-status').hidden; i++) await new Promise((resolve) => setImmediate(resolve));
    assert.equal(element('admin-workspace').hidden, false);
    assert.equal(element('admin-status').textContent, '');
    assert.equal(element('admin-status').hidden, true);
    return element;
  };

  const nodes = await simulate();
  let prevented = false;
  nodes('write-update-link').listeners.click({ preventDefault() { prevented = true; } });
  assert.equal(prevented, true);
  assert.equal(nodes('editor-panel').hidden, false);
  assert.equal(nodes('editor-panel').scrolled, true);
  nodes('editor-panel').hidden = true;
  nodes('new-post').listeners.click({ preventDefault() {} });
  assert.equal(nodes('editor-panel').hidden, false);
  const deepLink = await simulate('?compose=1');
  assert.equal(deepLink('editor-panel').hidden, false);
});


test('CMS shows alerts only when useful and hides idle-ready status without removing error feedback', async () => {
  const { readFile } = await import('node:fs/promises');
  const script = await readFile(new URL('../assets/js/admin.js', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/admin.css', import.meta.url), 'utf8');
  assert.ok(!script.includes("CMS is ready."));
  assert.ok(script.includes("renderList(); message('');"));
  assert.ok(script.includes('status.hidden = !value;'));
  assert.ok(css.includes('#admin-status[hidden]{display:none!important}'));
  assert.ok(script.includes("message('Saving update…')"));
  assert.ok(script.includes("message(error.message || 'Could not save update.', 'error')"));
  assert.ok(script.includes("message('Update restored.', 'success')"));
});


test('MAo Studio keeps emblem and uses Libre Caslon regular MAo plus bold Studio', async () => {
  const { readFile } = await import('node:fs/promises');
  const html = await readFile(new URL('../admin/index.html', import.meta.url), 'utf8');
  const css = await readFile(new URL('../assets/css/admin.css', import.meta.url), 'utf8');
  const headers = await readFile(new URL('../_headers', import.meta.url), 'utf8');
  const brand = html.match(/<a class="brand" href="\/admin\/"[^>]*>([\s\S]*?)<\/a>/);
  assert.ok(brand, 'sidebar brand link remains present');
  assert.ok(brand[1].includes('<img src="/assets/img/mao-logo.png" width="42" height="42" alt="">'));
  assert.ok(brand[1].includes('<span class="brand-wordmark"><span class="brand-wordmark__mao">MAo</span><strong class="brand-wordmark__studio">Studio</strong></span>'));
  assert.ok(!brand[1].includes('<small'));
  assert.ok(!brand[1].includes('Mkulima Agricultural Organization'));
  assert.ok(html.includes('href="/assets/css/admin.css?v=pwa-install-1"'));
  assert.ok(html.includes('id="write-update-link"'));
  assert.ok(html.includes('id="new-post"'));
  assert.ok(html.includes('<link rel="icon" href="/assets/img/mao-logo.png">'));
  assert.ok(css.includes("@import url('https://fonts.googleapis.com/css2?family=Libre+Caslon+Condensed:wght@400;700&display=swap')"));
  assert.ok(css.includes("font-family:'Libre Caslon Condensed',Georgia,serif"));
  assert.ok(css.includes('.brand-wordmark__mao{font-weight:400}'));
  assert.ok(css.includes('.brand-wordmark__studio{font-weight:700}'));
  assert.ok(css.includes('.brand img{width:42px;height:42px;object-fit:contain;flex:none}'));
  assert.ok(headers.includes("style-src 'self' 'unsafe-inline' https://fonts.googleapis.com"));
});

test.after(() => { globalThis.fetch = originalFetch; });
