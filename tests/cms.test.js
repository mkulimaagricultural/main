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

test.after(() => { globalThis.fetch = originalFetch; });
