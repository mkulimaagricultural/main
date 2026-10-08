(() => {
  const status = document.getElementById('admin-status');
  const workspace = document.getElementById('admin-workspace');
  const list = document.getElementById('post-list');
  const panel = document.getElementById('editor-panel');
  const form = document.getElementById('post-form');
  const newButton = document.getElementById('new-post');
  const imageNote = document.getElementById('current-image');
  let role = null;
  let posts = [];

  function message(text, kind = '') {
    status.textContent = text;
    status.dataset.kind = kind;
  }

  async function api(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { Accept: 'application/json', ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }

  function field(name) { return form.elements.namedItem(name); }

  function resetForm() {
    form.reset();
    field('id').value = '';
    field('image_url').value = '';
    imageNote.textContent = 'No image selected.';
    document.getElementById('editor-heading').textContent = 'New post';
  }

  function editPost(post) {
    for (const name of ['id', 'title_en', 'title_sw', 'body_en', 'body_sw', 'image_url', 'status']) {
      field(name).value = post[name] || '';
    }
    field('image').value = '';
    imageNote.textContent = post.image_url ? `Current image: ${post.image_url}` : 'No image selected.';
    document.getElementById('editor-heading').textContent = 'Edit post';
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderList() {
    list.replaceChildren();
    if (!posts.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No posts yet.';
      list.append(empty);
      return;
    }
    for (const post of posts) {
      const item = document.createElement('article');
      item.className = 'post-item';
      const title = document.createElement('h3');
      title.textContent = post.title_en;
      const badge = document.createElement('small');
      badge.textContent = post.status;
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'Review both languages';
      const en = document.createElement('p');
      en.textContent = `English: ${post.body_en}`;
      const sw = document.createElement('p');
      sw.textContent = `Kiswahili: ${post.body_sw}`;
      details.append(summary, en, sw);
      item.append(title, badge, details);
      if (role === 'admin') {
        const edit = document.createElement('button');
        edit.type = 'button';
        edit.textContent = 'Edit';
        edit.addEventListener('click', () => editPost(post));
        item.append(edit);
      }
      list.append(item);
    }
  }

  async function load() {
    const data = await api('/admin/api/posts');
    role = data.role;
    posts = data.posts;
    workspace.hidden = false;
    panel.hidden = role !== 'admin';
    newButton.hidden = role !== 'admin';
    renderList();
    message('Admin access is ready.', 'success');
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (role !== 'admin') return;
    const submit = form.querySelector('[type=submit]');
    submit.disabled = true;
    message('Saving post…');
    try {
      const file = field('image').files[0];
      let imageUrl = field('image_url').value;
      if (file) {
        const upload = new FormData();
        upload.append('image', file);
        imageUrl = (await api('/admin/api/uploads', { method: 'POST', body: upload })).image_url;
      }
      const post = Object.fromEntries(['title_en', 'title_sw', 'body_en', 'body_sw', 'status'].map((name) => [name, field(name).value]));
      post.image_url = imageUrl;
      const id = field('id').value;
      await api(id ? `/admin/api/posts/${encodeURIComponent(id)}` : '/admin/api/posts', {
        method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(post)
      });
      await load();
      resetForm();
      message('Post saved.', 'success');
    } catch (error) {
      message(error.message || 'Could not save post.', 'error');
    } finally {
      submit.disabled = false;
    }
  });

  newButton.addEventListener('click', () => { resetForm(); panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  document.getElementById('cancel-edit').addEventListener('click', resetForm);
  load().catch((error) => message(`${error.message} Cloudflare Access and the database must be configured before this CMS can be used.`, 'error'));
})();
