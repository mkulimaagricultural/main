import { getAdminRole, isSameOrigin } from '../../../lib/auth.js';
import { json } from '../../../lib/posts.js';

export async function onRequest(context) {
  const user = await getAdminRole(context.request, context.env);
  if (!user) return json({ error: 'Admin access denied.' }, 403);
  if (!['GET', 'HEAD'].includes(context.request.method) && !isSameOrigin(context.request)) {
    return json({ error: 'Invalid request origin.' }, 403);
  }
  context.data.admin = user;
  return context.next();
}
