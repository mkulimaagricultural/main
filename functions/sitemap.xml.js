// Keep sitemap.xml updated with MAo's published (non-trashed) CMS posts.
// Static sitemap.xml is also committed as a build-time fallback.
const ORIGIN = 'https://www.mkulimaagricultural.org';
const STATIC_PATHS = ['/', '/about/', '/focus/', '/updates/', '/contact/', '/donate/', '/app/', '/download/'];
const POST_LIMIT = 49_992; // Eight fixed URLs + up to 49,992 posts (50,000 maximum).
const ID_PATTERN = /^[a-zA-Z0-9-]{1,64}$/;

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  })[char]);
}

function lastModified(value) {
  if (typeof value !== 'string' || !value.trim()) return '';
  const input = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)
    ? value.replace(' ', 'T') + 'Z'
    : value;
  const time = new Date(input);
  return Number.isNaN(time.getTime()) ? '' : time.toISOString();
}

export function buildSitemap(posts = []) {
  const urls = STATIC_PATHS.map(path => ({ url: ORIGIN + path }));
  const seen = new Set(urls.map(item => item.url));
  for (const post of posts) {
    if (!post || !ID_PATTERN.test(post.id)) continue;
    const url = ORIGIN + '/updates/' + post.id;
    if (seen.has(url)) continue;
    seen.add(url);
    urls.push({ url, lastmod: lastModified(post.updated_at) });
    if (urls.length === 50_000) break;
  }
  return '<?xml version="1.0" encoding="UTF-8"?>\n'
    + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + urls.map(item => '  <url><loc>' + escapeXml(item.url) + '</loc>'
      + (item.lastmod ? '<lastmod>' + item.lastmod + '</lastmod>' : '')
      + '</url>').join('\n')
    + '\n</urlset>\n';
}

export async function onRequestGet({ env }) {
  if (!env.DB) return new Response('Sitemap temporarily unavailable.', {
    status: 503, headers: { 'Cache-Control': 'no-store' }
  });

  let posts;
  try {
    // Deleting or reverting a post to draft removes it from the sitemap.
    const result = await env.DB.prepare(`
      SELECT p.id, p.updated_at FROM posts p
      WHERE p.status = 'published'
        AND NOT EXISTS (
          SELECT 1 FROM post_meta m
          WHERE m.post_id = p.id AND m.deleted_at IS NOT NULL
        )
      ORDER BY p.created_at DESC LIMIT ${POST_LIMIT}
    `).all();
    posts = result.results || [];
  } catch {
    // Legacy D1 databases without post_meta still contain public posts.
    try {
      const result = await env.DB.prepare(`
        SELECT id, updated_at FROM posts
        WHERE status = 'published' ORDER BY created_at DESC LIMIT ${POST_LIMIT}
      `).all();
      posts = result.results || [];
    } catch {
      return new Response('Sitemap temporarily unavailable.', {
        status: 503, headers: { 'Cache-Control': 'no-store' }
      });
    }
  }

  return new Response(buildSitemap(posts), {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff'
    }
  });
}
