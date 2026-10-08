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
  try { await env.DB.prepare(`INSERT INTO post_meta (post_id, view_count) VALUES (?, 1)
    ON CONFLICT(post_id) DO UPDATE SET view_count = view_count + 1`).bind(post.id).run(); } catch { /* Views begin after migration. */ }
  const sw = new URL(request.url).searchParams.get('lang') === 'sw';
  const title = escapeHtml(sw ? post.title_sw : post.title_en);
  const body = escapeHtml(sw ? post.body_sw : post.body_en);
  const date = post.published_at ? new Date(post.published_at).toLocaleDateString(sw ? 'sw-TZ' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
  const image = /^\/(?:assets\/img\/[a-zA-Z0-9._-]+\.(?:jpg|png|webp)|api\/media\/[a-f0-9-]+\.(?:jpg|png|webp))$/.test(post.image_url || '')
    ? `<img class="cover" src="${escapeHtml(post.image_url)}" alt="" loading="eager">` : '';
  const opposite = sw ? 'English' : 'Kiswahili';
  const nextLang = sw ? 'en' : 'sw';
  const html = `<!doctype html><html lang="${sw ? 'sw' : 'en'}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} | MAo</title><meta name="description" content="${escapeHtml(body.slice(0, 155))}"><link rel="icon" href="/assets/img/mao-logo.png"><style>@import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@600;700&family=Inter:wght@400;500;600&display=swap');*{box-sizing:border-box}body{margin:0;background:#fbf8f1;color:#193a2b;font-family:Inter,system-ui,sans-serif}header{background:#142b20;color:white;padding:1rem max(1.2rem,calc((100vw - 1000px)/2));display:flex;align-items:center;justify-content:space-between;gap:1rem}header a{color:inherit;text-decoration:none}header .brand{display:flex;align-items:center;gap:.7rem;font:700 1.5rem Fraunces,Georgia,serif}header img{width:40px;height:40px;object-fit:contain}main{max-width:760px;margin:clamp(2rem,6vw,5rem) auto;padding:0 1.3rem}h1{font:700 clamp(2.4rem,6vw,4.4rem)/1.08 Fraunces,Georgia,serif;margin:.8rem 0 1.2rem}.eyebrow{color:#b74e30;text-transform:uppercase;font-size:.8rem;letter-spacing:.15em;font-weight:600}.date{color:#64776a}.cover{display:block;width:100%;max-height:500px;object-fit:cover;border-radius:1rem;margin:2rem 0}article p{font-size:clamp(1.05rem,2vw,1.25rem);line-height:1.8;white-space:pre-wrap}footer{max-width:760px;margin:4rem auto;padding:1.5rem 1.3rem;border-top:1px solid #d8e0d6;color:#607063}</style></head><body><header><a class="brand" href="/"><img src="/assets/img/mao-logo.png" alt="">MAo</a><a href="?lang=${nextLang}">${opposite}</a></header><main><a href="/#updates">${sw ? '← Taarifa zote' : '← All updates'}</a><article><p class="eyebrow">${sw ? 'Taarifa ya MAo' : 'MAo update'}</p><h1>${title}</h1><p class="date">${escapeHtml(date)}</p>${image}<p>${body}</p></article></main><footer>© ${new Date().getFullYear()} Mkulima Agricultural Organization</footer></body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
