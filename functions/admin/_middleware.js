import { getAdminRole, isSameOrigin } from '../../lib/auth.js';
import { json } from '../../lib/posts.js';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname !== 'admin.mkulimaagricultural.org') {
    if (url.pathname.startsWith('/admin/api/')) return json({ error: 'Admin API is only available on the admin domain.' }, 403);
    return Response.redirect(`https://admin.mkulimaagricultural.org${url.pathname}${url.search}`, 302);
  }
  const user = await getAdminRole(context.request, context.env);
  if (!user) return url.pathname.startsWith('/admin/api/')
    ? json({ error: 'Admin access denied.' }, 403)
    : new Response('Admin access is not configured or your session has expired.', { status: 403, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
  if (!['GET', 'HEAD'].includes(context.request.method) && !isSameOrigin(context.request)) {
    return json({ error: 'Invalid request origin.' }, 403);
  }
  context.data.admin = user;
  const original = await context.next();
  const response = new Response(original.body, original);
  response.headers.set('Cache-Control', 'no-store');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}
