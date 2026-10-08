import { json, parsePostRequest } from '../../../lib/posts.js';

export async function onRequestGet({ env, data }) {
  if (!env.DB) return json({ error: 'CMS database is not configured.' }, 503);
  try {
    const { results } = await env.DB.prepare(`
      SELECT id, title_en, title_sw, body_en, body_sw, image_url, status, created_at, updated_at, published_at
      FROM posts ORDER BY created_at DESC LIMIT 100
    `).all();
    return json({ role: data.admin.role, posts: results || [] });
  } catch {
    return json({ error: 'Could not load posts.' }, 503);
  }
}

export async function onRequestPost({ request, env, data }) {
  if (data.admin.role !== 'poster') return json({ error: 'Posting permission required.' }, 403);
  if (!env.DB) return json({ error: 'CMS database is not configured.' }, 503);
  const { post, error } = await parsePostRequest(request);
  if (error) return json({ error }, 400);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`
      INSERT INTO posts (id, title_en, title_sw, body_en, body_sw, image_url, status, created_at, updated_at, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, post.title_en, post.title_sw, post.body_en, post.body_sw, post.image_url,
      post.status, now, now, post.status === 'published' ? now : null).run();
    return json({ id }, 201);
  } catch {
    return json({ error: 'Could not save post.' }, 500);
  }
}
