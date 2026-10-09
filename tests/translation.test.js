import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePost } from '../lib/posts.js';
import { resolvePostTranslations } from '../lib/translate.js';
import { onRequestPost } from '../functions/admin/api/posts.js';

const base = { title: 'Kilimo ni uhai', description: 'Kikao cha ndani.', source_lang: 'sw', status: 'draft', media: [] };

test('single-language editor accepts one title and description', () => {
  assert.equal(validatePost(base).post.source_lang, 'sw');
  assert.ok(validatePost({ ...base, description: '' }).error);
  assert.ok(validatePost({ ...base, source_lang: 'xx' }).error);
});

test('new posts translate once and retain original source text', async () => {
  const calls = [];
  const ai = { async run(model, input) {
    calls.push({ model, ...input });
    return { translated_text: input.text === base.title ? 'Agriculture is life' : 'An internal meeting.' };
  } };
  const result = await resolvePostTranslations(validatePost(base).post, ai);
  assert.equal(result.title_sw, base.title);
  assert.equal(result.body_sw, base.description);
  assert.equal(result.title_en, 'Agriculture is life');
  assert.equal(result.body_en, 'An internal meeting.');
  assert.equal(calls.length, 2);
  assert.deepEqual(calls.map(({ source_lang, target_lang }) => [source_lang, target_lang]), [['sw', 'en'], ['sw', 'en']]);
});

test('media-only edits reuse stored translations without an AI binding', async () => {
  const existing = { title_sw: base.title, body_sw: base.description, title_en: 'Agriculture is life', body_en: 'An internal meeting.' };
  const result = await resolvePostTranslations(validatePost(base).post, undefined, existing);
  assert.equal(result.title_en, existing.title_en);
  assert.equal(result.body_en, existing.body_en);
});

test('text edits fail safely when translation is unavailable or empty', async () => {
  await assert.rejects(resolvePostTranslations(validatePost(base).post, undefined), /Workers AI binding/);
  await assert.rejects(resolvePostTranslations(validatePost(base).post, { run: async () => ({}) }), /no text/);
});

test('publishing cannot write a single-language post until translation succeeds', async () => {
  let writes = 0;
  const request = new Request('https://admin.mkulimaagricultural.org/admin/api/posts', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...base, status: 'published' })
  });
  const env = { DB: { batch: async () => { writes++; } } };
  const response = await onRequestPost({ request, env, data: { admin: { role: 'admin', email: 'admin@example.org' } } });
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /Workers AI binding/);
  assert.equal(writes, 0);
});
