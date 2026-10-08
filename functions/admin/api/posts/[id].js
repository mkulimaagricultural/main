import { json, parsePostRequest } from '../../../../lib/posts.js';

export async function onRequestPut({ request, env, data, params }) {
  if (data.admin.role !== 'admin') return json({ error: 'Admin permission required.' }, 403);
  if (!env.DB) return json({ error: 'CMS database is not configured.' }, 503);
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(params.id)) return json({ error: 'Invalid post ID.' }, 400);
  const { post, error } = await parsePostRequest(request);
  if (error) return json({ error }, 400);
  try {
    const existing = await env.DB.prepare('SELECT p.status, p.published_at, m.deleted_at FROM posts p LEFT JOIN post_meta m ON m.post_id = p.id WHERE p.id = ?').bind(params.id).first();
    if (!existing) return json({ error: 'Post not found.' }, 404);
    if (existing.deleted_at) return json({ error: 'Restore this post before editing it.' }, 409);
    const now = new Date().toISOString();
    const publishedAt = post.status === 'published' ? existing.published_at || now : null;
    await env.DB.batch([env.DB.prepare(`
      UPDATE posts SET title_en = ?, title_sw = ?, body_en = ?, body_sw = ?, image_url = ?,
        status = ?, updated_at = ?, published_at = ? WHERE id = ?
    `).bind(post.title_en, post.title_sw, post.body_en, post.body_sw, post.image_url,
      post.status, now, publishedAt, params.id),
    env.DB.prepare(`INSERT INTO post_meta (post_id, updated_by) VALUES (?, ?)
      ON CONFLICT(post_id) DO UPDATE SET updated_by = excluded.updated_by`).bind(params.id, data.admin.email)]);
    return json({ id: params.id });
  } catch {
    return json({ error: 'Could not update post.' }, 500);
  }
}

export async function onRequestDelete({ env, data, params }) {
  if (!env.DB) return json({ error: 'CMS database is not configured.' }, 503);
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(params.id)) return json({ error: 'Invalid post ID.' }, 400);
  const now = new Date().toISOString();
  try {
    const existing = await env.DB.prepare('SELECT id FROM posts WHERE id = ?').bind(params.id).first();
    if (!existing) return json({ error: 'Post not found.' }, 404);
    await env.DB.prepare(`INSERT INTO post_meta (post_id, deleted_at, updated_by) VALUES (?, ?, ?)
      ON CONFLICT(post_id) DO UPDATE SET deleted_at = excluded.deleted_at, updated_by = excluded.updated_by`)
      .bind(params.id, now, data.admin.email).run();
    return json({ id: params.id, deleted_at: now });
  } catch { return json({ error: 'Could not move post to trash.' }, 500); }
}
