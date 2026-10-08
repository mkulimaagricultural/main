export function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
}

const IMAGE_PATH = /^\/(?:assets\/img\/[a-zA-Z0-9._-]+\.(?:jpg|png|webp)|api\/media\/[a-f0-9-]+\.(?:jpg|png|webp))$/;
const VIDEO_PATH = /^\/api\/media\/[a-f0-9-]+\.(?:mp4|webm)$/;

export function isAllowedMediaUrl(url, type) {
  return typeof url === 'string' && (type === 'image' ? IMAGE_PATH.test(url) : type === 'video' && VIDEO_PATH.test(url));
}

export function validatePost(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return { error: 'Invalid post.' };
  const fields = {};
  for (const name of ['title_en', 'title_sw', 'body_en', 'body_sw']) {
    if (typeof input[name] !== 'string') return { error: `${name} is required.` };
    fields[name] = input[name].trim();
  }
  if (!fields.title_en || !fields.title_sw || !fields.body_en || !fields.body_sw) return { error: 'Both language versions are required.' };
  if (fields.title_en.length > 160 || fields.title_sw.length > 160 || fields.body_en.length > 10000 || fields.body_sw.length > 10000) return { error: 'Post text is too long.' };
  if (!['draft', 'published'].includes(input.status)) return { error: 'Invalid status.' };

  const legacyImage = input.image_url || '';
  if (typeof legacyImage !== 'string' || (legacyImage && !isAllowedMediaUrl(legacyImage, 'image'))) return { error: 'Invalid image URL.' };
  let media;
  if (input.media === undefined) {
    // Support clients that still send the original single image_url field.
    media = legacyImage ? [{ url: legacyImage, type: 'image' }] : [];
  } else {
    if (!Array.isArray(input.media)) return { error: 'Invalid media list.' };
    media = [];
    for (const item of input.media) {
      if (!item || typeof item !== 'object' || Array.isArray(item) || !isAllowedMediaUrl(item.url, item.type)) {
        return { error: 'Invalid image or video URL.' };
      }
      media.push({ url: item.url, type: item.type });
    }
  }
  const image_url = media.find((item) => item.type === 'image')?.url || '';
  return { post: { ...fields, status: input.status, image_url, media } };
}

export async function loadPostMedia(db, posts) {
  if (!posts.length) return posts;
  for (const post of posts) post.media = [];
  try {
    const placeholders = posts.map(() => '?').join(',');
    const { results } = await db.prepare(`SELECT post_id, media_url, media_type
      FROM post_media WHERE post_id IN (${placeholders}) ORDER BY post_id, position`)
      .bind(...posts.map((post) => post.id)).all();
    const byId = new Map(posts.map((post) => [post.id, post]));
    for (const row of results || []) {
      if (isAllowedMediaUrl(row.media_url, row.media_type)) {
        byId.get(row.post_id)?.media.push({ url: row.media_url, type: row.media_type });
      }
    }
  } catch {
    // When migration 0003 has not yet been applied, keep legacy image posts visible.
  }
  for (const post of posts) {
    if (!post.media.length && isAllowedMediaUrl(post.image_url, 'image')) {
      post.media = [{ url: post.image_url, type: 'image' }];
    }
  }
  return posts;
}

export async function parsePostRequest(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return { error: 'Send JSON.' };
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > 1_000_000) return { error: 'Post data is too large.' };
  try {
    const raw = await request.text();
    if (raw.length > 1_000_000) return { error: 'Post data is too large.' };
    return validatePost(JSON.parse(raw));
  } catch { return { error: 'Invalid JSON.' }; }
}
