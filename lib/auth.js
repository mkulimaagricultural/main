// Cloudflare Access verifies the identity; this function also verifies its signed JWT.
// The email allowlists live in Cloudflare environment variables, never in this repo.
function decodeBase64Url(value) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - value.length % 4) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0));
}

function allowedEmails(value) {
  return new Set(String(value || '').split(',').map((email) => email.trim().toLowerCase()).filter(Boolean));
}

export async function getAdminRole(request, env) {
  const token = request.headers.get('CF-Access-Jwt-Assertion');
  const audience = String(env.ACCESS_AUD || '').trim();
  const teamDomain = String(env.ACCESS_TEAM_DOMAIN || '').replace(/\/$/, '');
  if (!token || !audience || !teamDomain) return null;

  let url;
  try { url = new URL(teamDomain); } catch { return null; }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.cloudflareaccess.com') || url.pathname !== '/') return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0])));
    const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1])));
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || claims.type !== 'app') return null;

    const response = await fetch(`${teamDomain}/cdn-cgi/access/certs`, { cf: { cacheTtl: 300, cacheEverything: true } });
    if (!response.ok) return null;
    const certs = await response.json();
    const jwk = certs.keys?.find((key) => key.kid === header.kid && key.kty === 'RSA');
    if (!jwk) return null;
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    const signed = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, decodeBase64Url(parts[2]), signed);
    if (!valid) return null;

    const now = Math.floor(Date.now() / 1000);
    const expectedIssuer = teamDomain;
    if (claims.iss !== expectedIssuer || !Array.isArray(claims.aud) || !claims.aud.includes(audience)) return null;
    if (typeof claims.exp !== 'number' || claims.exp <= now || (typeof claims.nbf === 'number' && claims.nbf > now + 60)) return null;
    if (typeof claims.iat === 'number' && claims.iat > now + 60) return null;
    if (typeof claims.email !== 'string') return null;

    const email = claims.email.trim().toLowerCase();
    if (allowedEmails(env.MAO_ADMIN_EMAILS).has(email)) return { role: 'admin', email };
    return null;
  } catch {
    return null;
  }
}

export function isSameOrigin(request) {
  const origin = request.headers.get('Origin');
  return origin === new URL(request.url).origin;
}
