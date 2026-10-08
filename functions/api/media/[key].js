export async function onRequestGet({ env, params }) {
  if (!env.MEDIA) return new Response('Image storage is not configured.', { status: 503 });
  if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(params.key)) return new Response('Not found.', { status: 404 });
  const object = await env.MEDIA.get(params.key);
  if (!object) return new Response('Not found.', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(object.body, { headers });
}
