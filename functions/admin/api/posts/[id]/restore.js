import { json } from '../../../../../lib/posts.js';

export async function onRequestPost({ env, data, params }) {
  if (!env.DB) return json({ error: 'CMS database is not configured.' }, 503);
  if (!/^[a-zA-Z0-9-]{1,64}$/.test(params.id)) return json({ error: 'Invalid post ID.' }, 400);
  try {
    const result = await env.DB.prepare('UPDATE post_meta SET deleted_at = NULL, updated_by = ? WHERE post_id = ? AND deleted_at IS NOT NULL')
      .bind(data.admin.email, params.id).run();
    if (!result.meta?.changes) return json({ error: 'Post is not in trash.' }, 404);
    return json({ id: params.id });
  } catch { return json({ error: 'Could not restore post.' }, 500); }
}
