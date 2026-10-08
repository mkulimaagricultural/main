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

  // Use a fixed-length stream for R2: dynamically generated ReadableStreams are
  // not accepted by the R2 binding, even when their bytes are otherwise valid.
  if (!request.body || !['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'].includes(contentType)) {
    return json({ error: 'Upload a JPEG, PNG, WebP, MP4 or WebM file.' }, 400);
  }
  const claimedSize = request.headers.get('X-File-Size') || declaredLength;
  if (!claimedSize || !/^\d+$/.test(claimedSize)) {
    return json({ error: 'Missing file size. Please retry the upload.' }, 411);
  }
  const expectedSize = Number(claimedSize);
  if (!Number.isSafeInteger(expectedSize) || expectedSize <= 0) {
    return json({ error: 'Invalid file size.' }, 400);
  }
  if (declaredLength !== null && expectedSize !== Number(declaredLength)) {
    return json({ error: 'Upload size does not match the file size.' }, 400);
  }
  const max = contentType.startsWith('image/') ? IMAGE_LIMIT : VIDEO_LIMIT;
  if (expectedSize > max) {
    return json({ error: contentType.startsWith('image/') ? 'Each image must be 15 MB or smaller.' : 'Video must be 90 MB or smaller.' }, 413);
  }
  const reader = request.body.getReader();
  const prefixChunks = [];
  let prefixLength = 0;
  try {
    while (prefixLength < 512) {
      const result = await reader.read();
      if (result.done) break;
      prefixChunks.push(result.value);
      prefixLength += result.value.byteLength;
      if (prefixLength > expectedSize) break;
    }
    const header = new Uint8Array(Math.min(512, prefixLength));
    let copied = 0;
    for (const chunk of prefixChunks) {
      const take = Math.min(chunk.length, header.length - copied);
      header.set(chunk.subarray(0, take), copied);
      copied += take;
      if (copied >= header.length) break;
    }
    const type = detectedType(header);
    if (!type || type.mime !== contentType) {
      await reader.cancel();
      return json({ error: 'File contents do not match the allowed image or video type.' }, 400);
    }
    if (prefixLength > expectedSize) {
      await reader.cancel();
      return json({ error: 'Upload size does not match the file size.' }, 400);
    }
    const { readable, writable } = new FixedLengthStream(expectedSize);
    const writer = writable.getWriter();
    const key = `${crypto.randomUUID()}.${type.ext}`;
    const putPromise = env.MEDIA.put(key, readable, { httpMetadata: { contentType: type.mime } });
    let uploaded = 0;
    try {
      const push = async (chunk) => {
        uploaded += chunk.byteLength;
        if (uploaded > expectedSize || uploaded > max) throw new Error('File exceeds declared upload size.');
        await writer.write(chunk);
      };
      for (const chunk of prefixChunks) await push(chunk);
      while (true) {
        const result = await reader.read();
        if (result.done) break;
        await push(result.value);
      }
      if (uploaded !== expectedSize) throw new Error('Incomplete media upload.');
      await writer.close();
      await putPromise;
    } catch (error) {
      await reader.cancel().catch(() => {});
      await writer.abort(error).catch(() => {});
      await putPromise.catch(() => {});
      return json({ error: error.message === 'File exceeds declared upload size.' || error.message === 'Incomplete media upload.'
        ? 'Upload size does not match the file size.'
        : 'Could not upload media. Please retry.' }, 400);
    }
    const url = `/api/media/${key}`;
    return json({ media_url: url, media_type: type.type, ...(type.type === 'image' ? { image_url: url } : {}) }, 201);
  } catch {
    await reader.cancel().catch(() => {});
    return json({ error: 'Could not read media upload.' }, 400);
  }
}
