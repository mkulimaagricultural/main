import { json } from '../../../lib/posts.js';

export const IMAGE_LIMIT = 15_000_000;
export const VIDEO_LIMIT = 90_000_000;

export function detectedType(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg', type: 'image' };
  if (bytes.slice(0, 8).join(',') === '137,80,78,71,13,10,26,10') return { mime: 'image/png', ext: 'png', type: 'image' };
  if (String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') {
    return { mime: 'image/webp', ext: 'webp', type: 'image' };
  }
  const prefix = String.fromCharCode(...bytes.slice(0, 512));
  if (prefix.slice(4, 8) === 'ftyp') return { mime: 'video/mp4', ext: 'mp4', type: 'video' };
  if (bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3 && prefix.includes('webm')) {
    return { mime: 'video/webm', ext: 'webm', type: 'video' };
  }
  return null;
}

function invalidSize(type, size) {
  return !Number.isFinite(size) || size <= 0 || size > (type === 'video' ? VIDEO_LIMIT : IMAGE_LIMIT);
}

export async function onRequestPost({ request, env, data }) {
  if (data.admin?.role !== 'admin') return json({ error: 'Admin permission required.' }, 403);
  if (!env.MEDIA) return json({ error: 'Media storage is not configured.' }, 503);

  const contentType = request.headers.get('Content-Type') || '';
  const declaredLength = request.headers.get('Content-Length');
  const bodySize = declaredLength === null ? 0 : Number(declaredLength);
  if (declaredLength !== null && (!Number.isFinite(bodySize) || bodySize <= 0 || bodySize > VIDEO_LIMIT)) {
    return json({ error: 'File is empty or exceeds the 90 MB video upload limit.' }, 413);
  }

  // Compatibility for older CMS scripts that upload a single image via multipart.
  if (contentType.startsWith('multipart/form-data')) {
    if (bodySize > IMAGE_LIMIT + 20_000) return json({ error: 'Each image must be 15 MB or smaller.' }, 413);
    try {
      const form = await request.formData();
      const file = form.get('image');
      if (!(file instanceof File) || invalidSize('image', file.size)) return json({ error: 'Each image must be 15 MB or smaller.' }, 413);
      const bytes = new Uint8Array(await file.arrayBuffer());
      const kind = detectedType(bytes.subarray(0, 512));
      if (!kind || kind.type !== 'image' || kind.mime !== file.type) return json({ error: 'Use a JPEG, PNG or WebP image.' }, 400);
      const key = `${crypto.randomUUID()}.${kind.ext}`;
      await env.MEDIA.put(key, bytes, { httpMetadata: { contentType: kind.mime } });
      return json({ media_url: `/api/media/${key}`, media_type: kind.type, image_url: `/api/media/${key}` }, 201);
    } catch { return json({ error: 'Could not upload image.' }, 500); }
  }

  // Upload raw files as streams: large videos must never be buffered in Worker memory.
  if (!request.body || !['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(contentType)) {
    return json({ error: 'Upload a JPEG, PNG, WebP, MP4 or WebM file.' }, 400);
  }
  const reader = request.body.getReader();
  let buffered = [];
  let prefixLength = 0;
  try {
    while (prefixLength < 512) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffered.push(chunk.value);
      prefixLength += chunk.value.byteLength;
      if (prefixLength > VIDEO_LIMIT) throw new Error('limit');
    }
    const header = new Uint8Array(Math.min(512, prefixLength));
    let copied = 0;
    for (const chunk of buffered) {
      const length = Math.min(chunk.length, header.length - copied);
      header.set(chunk.subarray(0, length), copied);
      copied += length;
      if (copied >= header.length) break;
    }
    const kind = detectedType(header);
    if (!kind || kind.mime !== contentType) {
      await reader.cancel();
      return json({ error: 'File contents do not match the allowed image or video type.' }, 400);
    }
    const max = kind.type === 'video' ? VIDEO_LIMIT : IMAGE_LIMIT;
    if (prefixLength > max || bodySize > max) {
      await reader.cancel();
      return json({ error: kind.type === 'video' ? 'Video must be 90 MB or smaller.' : 'Each image must be 15 MB or smaller.' }, 413);
    }
    let index = 0;
    let total = 0;
    let exceeded = false;
    const stream = new ReadableStream({
      async pull(controller) {
        const result = index < buffered.length
          ? { done: false, value: buffered[index++] }
          : await reader.read();
        if (result.done) {
          if (declaredLength !== null && total !== bodySize) controller.error(new Error('Incomplete upload.'));
          else controller.close();
          return;
        }
        total += result.value.byteLength;
        if (total > max || (declaredLength !== null && total > bodySize)) {
          exceeded = true;
          controller.error(new Error('File exceeds upload limit.'));
          await reader.cancel();
          return;
        }
        controller.enqueue(result.value);
      },
      cancel(reason) { return reader.cancel(reason); }
    });
    const key = `${crypto.randomUUID()}.${kind.ext}`;
    try {
      await env.MEDIA.put(key, stream, { httpMetadata: { contentType: kind.mime } });
    } catch {
      return json({ error: exceeded ? 'File exceeds upload size limit.' : 'Could not upload media. Please retry.' }, exceeded ? 413 : 500);
    }
    const url = `/api/media/${key}`;
    return json({ media_url: url, media_type: kind.type, ...(kind.type === 'image' ? { image_url: url } : {}) }, 201);
  } catch {
    await reader.cancel().catch(() => {});
    return json({ error: 'Could not read media upload.' }, 400);
  }
}
