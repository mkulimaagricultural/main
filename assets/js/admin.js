(() => {
  const status = document.getElementById('admin-status');
  const workspace = document.getElementById('admin-workspace');
  const list = document.getElementById('post-list');
  const panel = document.getElementById('editor-panel');
  const form = document.getElementById('post-form');
  const imageNote = document.getElementById('current-image');
  let posts = [];
  let filter = 'active';

  function message(value, kind = '') { status.textContent = value; status.dataset.kind = kind; }
  function field(name) { return form.elements.namedItem(name); }
  function date(value) { return value ? new Date(value).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'; }
  async function api(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { Accept: 'application/json', ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }
  function resetForm() {
    form.reset(); field('id').value = ''; field('image_url').value = '';
    imageNote.textContent = 'No image selected.';
    document.getElementById('editor-heading').textContent = 'New update';
    panel.hidden = true;
  }
  function editPost(post) {
    for (const name of ['id', 'title_en', 'title_sw', 'body_en', 'body_sw', 'image_url', 'status']) field(name).value = post[name] || '';
    field('image').value = '';
    imageNote.textContent = post.image_url ? `Current image: ${post.image_url}` : 'No image selected.';
    document.getElementById('editor-heading').textContent = 'Edit update';
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function cell(row, value, className) {
    const td = document.createElement('td');
    if (className) td.className = className;
    if (typeof value === 'string') td.textContent = value;
    else if (value) td.append(value);
    row.append(td);
    return td;
  }
  function action(label, handler, dangerous = false) {
    const button = document.createElement('button');
    button.type = 'button'; button.textContent = label;
    if (dangerous) button.className = 'danger';
    button.addEventListener('click', handler);
    return button;
  }
  async function moveToTrash(post) {
    if (!confirm(`Move “${post.title_en}” to Trash? It will disappear from the public website.`)) return;
    try { await api(`/admin/api/posts/${encodeURIComponent(post.id)}`, { method: 'DELETE' }); await load(); message('Update moved to Trash.', 'success'); }
    catch (error) { message(error.message, 'error'); }
  }
  async function restore(post) {
    try { await api(`/admin/api/posts/${encodeURIComponent(post.id)}/restore`, { method: 'POST' }); await load(); message('Update restored.', 'success'); }
    catch (error) { message(error.message, 'error'); }
  }
  function renderList() {
    list.replaceChildren();
    const visible = posts.filter((post) => filter === 'trash' ? !!post.deleted_at : !post.deleted_at);
    if (!visible.length) {
      const row = document.createElement('tr'); cell(row, filter === 'trash' ? 'Trash is empty.' : 'No updates yet.', 'empty-row').colSpan = 6; list.append(row); return;
    }
    for (const post of visible) {
      const row = document.createElement('tr');
      const title = document.createElement('div'); title.className = 'post-title'; title.textContent = post.title_en;
      const subtitle = document.createElement('div'); subtitle.className = 'post-subtitle'; subtitle.textContent = post.title_sw;
      const first = cell(row); first.append(title, subtitle);
      const badge = document.createElement('span'); badge.className = `pill ${post.deleted_at ? 'trashed' : post.status}`;
      badge.textContent = post.deleted_at ? 'Trash' : post.status === 'published' ? 'Published' : 'Draft'; cell(row, badge);
      cell(row, date(post.published_at)); cell(row, Number(post.view_count || 0).toLocaleString());
      const editor = post.updated_by ? ` · ${post.updated_by}` : ''; cell(row, `${date(post.updated_at)}${editor}`);
      const actions = document.createElement('div'); actions.className = 'row-actions';
      if (post.deleted_at) actions.append(action('Restore', () => restore(post)));
      else {
        actions.append(action('Edit', () => editPost(post)));
        if (post.status === 'published') {
          const view = document.createElement('a'); view.href = `https://mkulimaagricultural.org/updates/${encodeURIComponent(post.id)}`;
          view.target = '_blank'; view.rel = 'noopener'; view.textContent = 'View ↗'; actions.append(view);
        }
        actions.append(action('Trash', () => moveToTrash(post), true));
      }
      cell(row, actions); list.append(row);
    }
  }
  async function load() {
    const data = await api('/admin/api/posts');
    posts = data.posts;
    workspace.hidden = false;
    document.getElementById('new-post').hidden = false;
    document.getElementById('admin-email').textContent = data.email || 'Secure admin area';
    const active = posts.filter((post) => !post.deleted_at);
    document.getElementById('nav-count').textContent = active.length;
    document.getElementById('stat-published').textContent = active.filter((post) => post.status === 'published').length;
    document.getElementById('stat-drafts').textContent = active.filter((post) => post.status === 'draft').length;
    document.getElementById('stat-views').textContent = active.reduce((sum, post) => sum + Number(post.view_count || 0), 0).toLocaleString();
    renderList(); message('CMS is ready.', 'success');
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('[type=submit]'); submit.disabled = true; message('Saving update…');
    try {
      const file = field('image').files[0]; let imageUrl = field('image_url').value;
      if (file) { const upload = new FormData(); upload.append('image', file); imageUrl = (await api('/admin/api/uploads', { method: 'POST', body: upload })).image_url; }
      const post = Object.fromEntries(['title_en', 'title_sw', 'body_en', 'body_sw', 'status'].map((name) => [name, field(name).value]));
      post.image_url = imageUrl; const id = field('id').value;
      await api(id ? `/admin/api/posts/${encodeURIComponent(id)}` : '/admin/api/posts', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(post) });
      resetForm(); await load(); message('Update saved. Published posts are live now.', 'success');
    } catch (error) { message(error.message || 'Could not save update.', 'error'); }
    finally { submit.disabled = false; }
  });
  document.getElementById('new-post').addEventListener('click', () => { resetForm(); panel.hidden = false; panel.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  document.getElementById('cancel-edit').addEventListener('click', resetForm);
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('active', item === button));
    renderList();
  }));
  load().catch((error) => message(`${error.message} Check Cloudflare Access, Pages bindings and the 0002 migration.`, 'error'));
})();
