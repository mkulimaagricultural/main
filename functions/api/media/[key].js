export async function onRequestGet({ env, params, request }) {
  if (!env.MEDIA) return new Response('Media storage is not configured.', { status: 503 });
  if (!/^[a-f0-9-]+\.(jpg|png|webp|mp4|webm)$/.test(params.key)) return new Response('Not found.', { status: 404 });
  const rangeHeader = request.headers.get('Range');
  const object = await env.MEDIA.get(params.key, rangeHeader ? { range: request.headers } : undefined);
  if (!object) return new Response('Not found.', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Accept-Ranges', 'bytes');
  if (!object.body) {
    headers.set('Content-Range', `bytes */${object.size}`);
    return new Response(null, { status: 416, headers });
  }
  if (rangeHeader && object.range && Number.isInteger(object.range.offset) && Number.isInteger(object.range.length)) {
    const start = object.range.offset;
    headers.set('Content-Range', `bytes ${start}-${start + object.range.length - 1}/${object.size}`);
    headers.set('Content-Length', String(object.range.length));
    return new Response(object.body, { status: 206, headers });
  }
  headers.set('Content-Length', String(object.size));
  return new Response(object.body, { status: 200, headers });
}
