import { json } from '../../lib/posts.js';

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'CMS database is not configured.' }, 503);
  try {
    const { results } = await env.DB.prepare(`
      SELECT id, title_en, title_sw, body_en, body_sw, image_url, published_at
      FROM posts WHERE status = 'published'
      ORDER BY published_at DESC, created_at DESC LIMIT 30
    `).all();
    return json({ posts: results || [] });
  } catch {
    return json({ error: 'Updates are temporarily unavailable.' }, 503);
  }
}
