export function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
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
  const imageUrl = input.image_url || '';
  if (typeof imageUrl !== 'string' || (imageUrl && !/^\/(assets\/img\/[a-zA-Z0-9._-]+\.(jpg|png|webp)|api\/media\/[a-f0-9-]+\.(jpg|png|webp))$/.test(imageUrl))) return { error: 'Invalid image URL.' };
  return { post: { ...fields, status: input.status, image_url: imageUrl } };
}

export async function parsePostRequest(request) {
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return { error: 'Send JSON.' };
  const length = Number(request.headers.get('Content-Length') || 0);
  if (length > 60000) return { error: 'Post is too large.' };
  try {
    const raw = await request.text();
    if (raw.length > 60000) return { error: 'Post is too large.' };
    return validatePost(JSON.parse(raw));
  } catch { return { error: 'Invalid JSON.' }; }
}
