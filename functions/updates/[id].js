import { loadPostMedia } from '../../lib/posts.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

export async function onRequestGet({ env, params, request }) {
  if (!env.DB || !/^[a-zA-Z0-9-]{1,64}$/.test(params.id)) return new Response('Not found', { status: 404 });
  let post;
  try {
    post = await env.DB.prepare(`SELECT p.id, p.title_en, p.title_sw, p.body_en, p.body_sw,
      p.image_url, p.published_at FROM posts p LEFT JOIN post_meta m ON m.post_id = p.id
      WHERE p.id = ? AND p.status = 'published' AND m.deleted_at IS NULL`).bind(params.id).first();
  } catch {
    try { post = await env.DB.prepare(`SELECT id, title_en, title_sw, body_en, body_sw, image_url, published_at
      FROM posts WHERE id = ? AND status = 'published'`).bind(params.id).first(); } catch { /* Database unavailable. */ }
  }
  if (!post) return new Response('Not found', { status: 404 });
  await loadPostMedia(env.DB, [post]);
  try { await env.DB.prepare(`INSERT INTO post_meta (post_id, view_count) VALUES (?, 1)
    ON CONFLICT(post_id) DO UPDATE SET view_count = view_count + 1`).bind(post.id).run(); } catch { /* Views begin after migration. */ }
  const sw = new URL(request.url).searchParams.get('lang') === 'sw';
  const title = escapeHtml(sw ? post.title_sw : post.title_en);
  const body = escapeHtml(sw ? post.body_sw : post.body_en);
  const date = post.published_at ? new Date(post.published_at).toLocaleDateString(sw ? 'sw-TZ' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const mediaMarkup = (post.media || []).map((item) => {
    const src = escapeHtml(item.url);
    return item.type === 'video'
      ? `<video controls playsinline preload="metadata" src="${src}"></video>`
      : `<img src="${src}" alt="" loading="lazy" decoding="async">`;
  }).join('');
  const mediaGallery = mediaMarkup ? `<div class="media-gallery">${mediaMarkup}</div>` : '';
  const canonicalUrl = `https://www.mkulimaagricultural.org/updates/${post.id}`;
  const previewImage = (post.media || []).find((item) => item.type === 'image')?.url
    || '/assets/img/hero-farm.jpg';
  const previewImageUrl = `https://www.mkulimaagricultural.org${previewImage}`;
  const shortDescription = escapeHtml((sw ? post.body_sw : post.body_en).slice(0, 155));
  const shareTitle = `${title} | MAo`;
  const opposite = sw ? 'English' : 'Kiswahili';
  const nextLang = sw ? 'en' : 'sw';
  const html = `<!doctype html><html lang="${sw ? 'sw' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${shareTitle}</title><meta name="description" content="${shortDescription}"><link rel="canonical" href="${escapeHtml(canonicalUrl)}"><meta property="og:type" content="article"><meta property="og:site_name" content="Mkulima Agricultural Organization"><meta property="og:title" content="${shareTitle}"><meta property="og:description" content="${shortDescription}"><meta property="og:url" content="${escapeHtml(canonicalUrl)}"><meta property="og:image" content="${escapeHtml(previewImageUrl)}"><meta property="og:image:alt" content="Mkulima Agricultural Organization update"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${shareTitle}"><meta name="twitter:description" content="${shortDescription}"><meta name="twitter:image" content="${escapeHtml(previewImageUrl)}"><link rel="icon" href="/assets/img/mao-logo.png"><link rel="manifest" href="/manifest.webmanifest"><meta name="theme-color" content="#15382b"><link rel="apple-touch-icon" href="/assets/icons/mao-apple-180.png"><script src="/assets/js/pwa-public.js" defer></script><link rel="preload" as="image" href="/assets/img/mao-logo.png"><script src="/assets/js/home-intro.js?v=2"></script><link rel="stylesheet" href="/assets/css/mao.css?v=public-logo-intro-2"><style>@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter:wght@400;500;600&display=swap');*{box-sizing:border-box}body{margin:0;background:#fbf8f1;color:#193a2b;font-family:Inter,system-ui,sans-serif}header{background:#142b20;color:white;padding:1rem max(1.2rem,calc((100vw - 1000px)/2));display:flex;align-items:center;justify-content:space-between;gap:1rem}header a{color:inherit;text-decoration:none}header .brand{display:flex;align-items:center;gap:.7rem;font:700 1.5rem Fraunces,Georgia,serif}header img{width:40px;height:40px;object-fit:contain}main{max-width:760px;margin:clamp(2rem,6vw,5rem) auto;padding:0 1.3rem}h1{font:700 clamp(2.4rem,6vw,4.4rem)/1.08 Fraunces,Georgia,serif;margin:.8rem 0 1.2rem}.eyebrow{color:#b74e30;text-transform:uppercase;font-size:.8rem;letter-spacing:.15em;font-weight:600}.date{color:#64776a}.media-gallery{display:grid;gap:1rem;margin:2rem 0}.media-gallery img,.media-gallery video{display:block;width:100%;max-height:680px;object-fit:contain;border-radius:1rem;background:#e9ece5}.media-gallery video{background:#0f1814}article p{font-size:clamp(1.05rem,2vw,1.25rem);line-height:1.8;white-space:pre-wrap}footer{max-width:760px;margin:4rem auto;padding:1.5rem 1.3rem;border-top:1px solid #d8e0d6;color:#607063}</style></head><body><div id="mao-home-intro" class="mao-home-intro" aria-hidden="true"><img src="/assets/img/mao-logo.png" alt="" width="150" height="150" fetchpriority="high"></div><header><a class="brand" href="/"><img src="/assets/img/mao-logo.png" alt="">MAo</a><a href="?lang=${nextLang}">${opposite}</a></header><main><a href="/#updates">${sw ? '← Taarifa zote' : '← All updates'}</a><article><p class="eyebrow">${sw ? 'Taarifa ya MAo' : 'MAo update'}</p><h1>${title}</h1><p class="date">${escapeHtml(date)}</p>${mediaGallery}<p>${body}</p></article></main><footer>© ${new Date().getFullYear()} Mkulima Agricultural Organization</footer></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
