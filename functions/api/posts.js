import { json } from '../../lib/posts.js';

export async function onRequestGet({ env }) {
  if (!env.DB) return json({ error: 'CMS database is not configured.' }, 503);
  try {
    const { results } = await env.DB.prepare(`
      SELECT p.id, p.title_en, p.title_sw, p.body_en, p.body_sw, p.image_url, p.published_at
      FROM posts p LEFT JOIN post_meta m ON m.post_id = p.id
      WHERE p.status = 'published' AND m.deleted_at IS NULL
      ORDER BY p.published_at DESC, p.created_at DESC LIMIT 30
    `).all();
    return json({ posts: results || [] });
  } catch {
    // Keep the public site available during the rollout before 0002_cms.sql is applied.
    try {
      const { results } = await env.DB.prepare(`SELECT id, title_en, title_sw, body_en, body_sw, image_url, published_at
        FROM posts WHERE status = 'published' ORDER BY published_at DESC, created_at DESC LIMIT 30`).all();
      return json({ posts: results || [] });
    } catch { return json({ error: 'Updates are temporarily unavailable.' }, 503); }
  }
}
