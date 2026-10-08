import { json } from '../../../lib/posts.js';

function detectedType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' };
  if (bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10') return { mime: 'image/png', ext: 'png' };
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return { mime: 'image/webp', ext: 'webp' };
  return null;
}

export async function onRequestPost({ request, env, data }) {
  if (data.admin.role !== 'admin') return json({ error: 'Admin permission required.' }, 403);
  if (!env.MEDIA) return json({ error: 'Image storage is not configured.' }, 503);
  if (!request.headers.get('Content-Type')?.startsWith('multipart/form-data')) return json({ error: 'Send an image file.' }, 400);
  if (Number(request.headers.get('Content-Length') || 0) > 5_200_000) return json({ error: 'Choose an image under 5 MB.' }, 413);
  try {
    const form = await request.formData();
    const file = form.get('image');
    if (!(file instanceof File) || file.size === 0 || file.size > 5_000_000) return json({ error: 'Choose an image under 5 MB.' }, 400);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const type = detectedType(bytes);
    if (!type || file.type !== type.mime) return json({ error: 'Use a JPEG, PNG or WebP image.' }, 400);
    const key = `${crypto.randomUUID()}.${type.ext}`;
    await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: type.mime } });
    return json({ image_url: `/api/media/${key}` }, 201);
  } catch {
    return json({ error: 'Could not upload image.' }, 500);
  }
}
