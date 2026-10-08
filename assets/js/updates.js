(() => {
  const list = document.getElementById('updates-list');
  if (!list) return;
  let posts = null;

  function render() {
    if (!posts) return;
    const sw = document.documentElement.lang === 'sw';
    if (!posts.length) {
      const empty = document.createElement('p');
      empty.textContent = sw ? 'Hakuna taarifa iliyochapishwa bado.' : 'No updates have been published yet.';
      list.replaceChildren(empty);
      return;
    }

    const cards = posts.map((post) => {
      const article = document.createElement('article');
      article.className = 'mao-update-card';
      if (post.image_url) {
        const image = document.createElement('img');
        image.src = post.image_url;
        image.alt = sw ? post.title_sw : post.title_en;
        image.loading = 'lazy';
        image.decoding = 'async';
        article.append(image);
      }
      const body = document.createElement('div');
      body.className = 'mao-update-card__body';
      const tag = document.createElement('span');
      tag.className = 'mao-update-card__tag';
      tag.textContent = sw ? 'Taarifa ya MAo' : 'MAo update';
      const title = document.createElement('h3');
      const link = document.createElement('a');
      link.href = `/updates/${encodeURIComponent(post.id)}${sw ? '?lang=sw' : ''}`;
      link.textContent = sw ? post.title_sw : post.title_en;
      title.append(link);
      const description = document.createElement('p');
      description.textContent = sw ? post.body_sw : post.body_en;
      body.append(tag, title, description);
      article.append(body);
      return article;
    });
    list.replaceChildren(...cards);
  }

  window.addEventListener('mao:language-change', render);
  fetch('/api/posts', { headers: { Accept: 'application/json' } })
    .then((response) => response.ok ? response.json() : null)
    .then((data) => {
      if (!data || !Array.isArray(data.posts)) return;
      posts = data.posts;
      render();
    })
    .catch(() => { /* Keep the supplied first post visible in static previews. */ });
})();
