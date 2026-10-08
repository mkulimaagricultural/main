import { json, parsePostRequest, loadPostMedia } from '../../../lib/posts.js';

export async function onRequestGet({ env, data }) {
  if (!env.DB) return json({ error: 'CMS database is not configured.' }, 503);
  try {
    const { results } = await env.DB.prepare(`
      SELECT p.id, p.title_en, p.title_sw, p.body_en, p.body_sw, p.image_url, p.status,
        p.created_at, p.updated_at, p.published_at, m.deleted_at, m.view_count,
        m.created_by, m.updated_by
      FROM posts p LEFT JOIN post_meta m ON m.post_id = p.id
      ORDER BY p.created_at DESC LIMIT 100
    `).all();
    const posts = await loadPostMedia(env.DB, results || []);
    return json({ role: data.admin.role, email: data.admin.email, posts });
  } catch {
    return json({ error: 'Could not load posts.' }, 503);
  }
}

export async function onRequestPost({ request, env, data }) {
  if (data.admin.role !== 'admin') return json({ error: 'Admin permission required.' }, 403);
  if (!env.DB) return json({ error: 'CMS database is not configured.' }, 503);
  const { post, error } = await parsePostRequest(request);
  if (error) return json({ error }, 400);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  try {
    const operations = [env.DB.prepare(`
      INSERT INTO posts (id, title_en, title_sw, body_en, body_sw, image_url, status, created_at, updated_at, published_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, post.title_en, post.title_sw, post.body_en, post.body_sw, post.image_url,
      post.status, now, now, post.status === 'published' ? now : null),
    env.DB.prepare('INSERT INTO post_meta (post_id, created_by, updated_by) VALUES (?, ?, ?)')
      .bind(id, data.admin.email, data.admin.email)];
    post.media.forEach((item, position) => operations.push(env.DB.prepare(
      'INSERT INTO post_media (post_id, position, media_url, media_type) VALUES (?, ?, ?, ?)'
    ).bind(id, position, item.url, item.type)));
    await env.DB.batch(operations);
    return json({ id }, 201);
  } catch {
    return json({ error: 'Could not save post. Check that migration 0003_post_media.sql is applied.' }, 500);
  }
}
