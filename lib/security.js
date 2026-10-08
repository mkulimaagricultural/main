// Shared security policy for Pages Functions, matching static _headers.
// Full script/style restrictions are Report-Only until browser tests confirm safety.
export const CSP_REPORT_ONLY = "default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.cdnfonts.com; font-src 'self' https://fonts.gstatic.com https://fonts.cdnfonts.com data:; img-src 'self' data: blob:; media-src 'self' blob:; connect-src 'self'; form-action 'self'";
export const FRAME_ANCESTORS = "frame-ancestors 'none'";
export const HSTS = 'max-age=15552000';
export const SECURE_HOSTS = new Set([
  'www.mkulimaagricultural.org',
  'mkulimaagricultural.org',
  'admin.mkulimaagricultural.org'
]);

export function secureResponse(response, requestUrl) {
  const url = new URL(requestUrl);
  // Preserve original response status, body, cookies, cache and CORS headers.
  const secured = new Response(response.body, response);
  secured.headers.set('Content-Security-Policy', FRAME_ANCESTORS);
  secured.headers.set('Content-Security-Policy-Report-Only', CSP_REPORT_ONLY);
  secured.headers.set('X-Frame-Options', 'DENY');
  secured.headers.set('X-Content-Type-Options', 'nosniff');
  if (url.protocol === 'https:' && SECURE_HOSTS.has(url.hostname)) {
    secured.headers.set('Strict-Transport-Security', HSTS);
  }
  return secured;
}
