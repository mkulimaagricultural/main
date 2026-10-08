import { secureResponse } from '../lib/security.js';

// Static Pages assets use _headers; Pages Functions require response headers here.
export async function onRequest(context) {
  const response = await context.next();
  return secureResponse(response, context.request.url);
}
