import { json, parsePostRequest } from '../../../../lib/posts.js';

export async function onRequestPut({ request, env, data, params }) {
  if (data.admin.role !== 'admin') return json({ error: 'Admin permission required.' }, 403);
  if (!env.DB) return json({ error: 'CMS database is not configured.' }, 503);
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(params.id)) return json({ error: 'Invalid post ID.' }, 400);
  const { post, error } = await parsePostRequest(request);
  if (error) return json({ error }, 400);
  try {
    const existing = await env.DB.prepare('SELECT status, published_at FROM posts WHERE id = ?').bind(params.id).first();
    if (!existing) return json({ error: 'Post not found.' }, 404);
    const now = new Date().toISOString();
    const publishedAt = post.status === 'published' ? existing.published_at || now : null;
    await env.DB.prepare(`
      UPDATE posts SET title_en = ?, title_sw = ?, body_en = ?, body_sw = ?, image_url = ?,
        status = ?, updated_at = ?, published_at = ? WHERE id = ?
    `).bind(post.title_en, post.title_sw, post.body_en, post.body_sw, post.image_url,
      post.status, now, publishedAt, params.id).run();
    return json({ id: params.id });
  } catch {
    return json({ error: 'Could not update post.' }, 500);
  }
}
