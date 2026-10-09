(() => {
  const status = document.getElementById('admin-status');
  const workspace = document.getElementById('admin-workspace');
  const list = document.getElementById('post-list');
  const panel = document.getElementById('editor-panel');
  const form = document.getElementById('post-form');
  const mediaList = document.getElementById('media-items');
  const mediaInput = form.elements.namedItem('media');
  const IMAGE_LIMIT = 15_000_000;
  const VIDEO_LIMIT = 90_000_000;
  const allowed = new Set(['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']);
  let attachments = [];

  function mediaKind(file) { return file.type.startsWith('image/') ? 'image' : 'video'; }
  function releasePreviews() {
    for (const item of attachments) if (item.preview) URL.revokeObjectURL(item.preview);
  }
  function renderMedia() {
    mediaList.replaceChildren();
    if (!attachments.length) {
      const empty = document.createElement('p');
      empty.textContent = 'No photos or videos attached.';
      mediaList.append(empty);
      return;
    }
    for (const item of attachments) {
      const card = document.createElement('div');
      card.className = 'media-item';
      const url = item.preview || item.url;
      const preview = document.createElement(item.type === 'image' ? 'img' : 'video');
      preview.src = url;
      preview.preload = 'metadata';
      if (item.type === 'video') { preview.controls = true; preview.playsInline = true; }
      else preview.alt = '';
      const details = document.createElement('span');
      details.textContent = item.file?.name || item.url.split('/').pop();
      details.title = details.textContent;
      const remove = action('Remove', () => {
        if (item.preview) URL.revokeObjectURL(item.preview);
        attachments = attachments.filter((candidate) => candidate !== item);
        renderMedia();
      }, true);
      remove.setAttribute('aria-label', `Remove ${details.textContent}`);
      card.append(preview, details, remove);
      mediaList.append(card);
    }
  }
  mediaInput.addEventListener('change', () => {
    for (const file of mediaInput.files) {
      const max = mediaKind(file) === 'image' ? IMAGE_LIMIT : VIDEO_LIMIT;
      if (!allowed.has(file.type) || !file.size || file.size > max) {
        message(`Skipped "${file.name}": use JPEG/PNG/WebP (max 15 MB) or MP4/WebM (max 90 MB).`, 'error');
        continue;
      }
      attachments.push({ type: mediaKind(file), file, preview: URL.createObjectURL(file) });
    }
    mediaInput.value = '';
    renderMedia();
  });
  let posts = [];
  let filter = 'active';
  let editingPost = null;
  let localDraft = null;
  let draftStorageKey = '';

  function message(value, kind = '') { status.textContent = value; status.dataset.kind = kind; status.hidden = !value; }
  function field(name) { return form.elements.namedItem(name); }
  function date(value) { return value ? new Date(value).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'; }
  function readLocalDraft() {
    try {
      const saved = JSON.parse(window.localStorage?.getItem(draftStorageKey) || 'null');
      return saved && typeof saved.title === 'string' && typeof saved.description === 'string'
        && ['en', 'sw'].includes(saved.source_lang) ? saved : null;
    } catch { return null; }
  }
  function clearLocalDraft() {
    try { window.localStorage?.removeItem(draftStorageKey); } catch { /* Storage may be unavailable. */ }
    localDraft = null;
  }
  function updateSummary() {
    const active = posts.filter((post) => !post.deleted_at);
    document.getElementById('nav-count').textContent = active.length + (localDraft ? 1 : 0);
    document.getElementById('stat-published').textContent = active.filter((post) => post.status === 'published').length;
    document.getElementById('stat-drafts').textContent = active.filter((post) => post.status === 'draft').length + (localDraft ? 1 : 0);
    document.getElementById('stat-views').textContent = active.reduce((sum, post) => sum + Number(post.view_count || 0), 0).toLocaleString();
  }
  function persistLocalDraft() {
    if (!draftStorageKey || editingPost || field('id').value) return;
    const title = field('title').value;
    const description = field('description').value;
    if (!title.trim() && !description.trim()) clearLocalDraft();
    else {
      localDraft = { title, description, source_lang: field('source_lang').value, updated_at: new Date().toISOString() };
      try { window.localStorage?.setItem(draftStorageKey, JSON.stringify(localDraft)); }
      catch { message('Automatic draft saving is unavailable in this browser. Use Save draft before leaving.', 'error'); }
    }
    document.getElementById('draft-note').textContent = localDraft
      ? 'Unfinished draft saved on this device. Reselect photos or videos if you close this tab.'
      : 'Unfinished writing is saved on this device as you type. Reselect photos or videos if you close this tab.';
    updateSummary();
    renderList();
  }
  async function api(url, options = {}) {
    const response = await fetch(url, { ...options, headers: { Accept: 'application/json', ...(options.headers || {}) } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || `Request failed (${response.status}).`);
    return data;
  }
  function resetForm() {
    releasePreviews();
    attachments = [];
    form.reset();
    field('id').value = '';
    editingPost = null;
    renderMedia();
    document.getElementById('editor-heading').textContent = 'New update';
    document.getElementById('draft-note').textContent = 'Unfinished writing is saved on this device as you type. Reselect photos or videos if you close this tab.';
    document.getElementById('save-draft').textContent = 'Save draft';
    document.getElementById('publish-update').textContent = 'Publish update';
    panel.hidden = true;
  }
  function editPost(post) {
    releasePreviews();
    editingPost = post;
    field('id').value = post.id;
    field('source_lang').value = 'en';
    field('title').value = post.title_en || '';
    field('description').value = post.body_en || '';
    attachments = (post.media?.length ? post.media : post.image_url ? [{ url: post.image_url, type: 'image' }] : [])
      .map((item) => ({ url: item.url, type: item.type }));
    mediaInput.value = '';
    renderMedia();
    document.getElementById('editor-heading').textContent = 'Edit update';
    document.getElementById('draft-note').textContent = 'Changes to this update are saved when you choose one of the buttons below.';
    document.getElementById('save-draft').textContent = post.status === 'published' ? 'Unpublish & save draft' : 'Save draft';
    document.getElementById('publish-update').textContent = post.status === 'published' ? 'Save & keep published' : 'Publish update';
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  field('source_lang').addEventListener('change', () => {
    if (!editingPost) { persistLocalDraft(); return; }
    const language = field('source_lang').value;
    field('title').value = editingPost[`title_${language}`] || '';
    field('description').value = editingPost[`body_${language}`] || '';
  });
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
    if (filter === 'active' && localDraft) {
      const row = document.createElement('tr');
      const title = document.createElement('div'); title.className = 'post-title'; title.textContent = localDraft.title.trim() || 'Untitled draft';
      const subtitle = document.createElement('div'); subtitle.className = 'local-draft-note'; subtitle.textContent = 'Unfinished · saved on this device only';
      cell(row).append(title, subtitle);
      const badge = document.createElement('span'); badge.className = 'pill draft'; badge.textContent = 'Draft'; cell(row, badge);
      cell(row, '—'); cell(row, '—'); cell(row, `${date(localDraft.updated_at)} · this device`);
      const actions = document.createElement('div'); actions.className = 'row-actions';
      actions.append(action('Resume', resumeLocalDraft));
      actions.append(action('Discard', discardLocalDraft, true));
      cell(row, actions); list.append(row);
    }
    if (!visible.length && !(filter === 'active' && localDraft)) {
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
    if (!draftStorageKey && data.email) {
      draftStorageKey = `mao-studio-new-draft-v1:${data.email.toLowerCase()}`;
      localDraft = readLocalDraft();
    }
    workspace.hidden = false;
    document.getElementById('new-post').hidden = false;
    document.getElementById('admin-email').textContent = data.email || 'Secure admin area';
    updateSummary();
    renderList(); message('');
  }
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const intent = event.submitter?.value === 'published' ? 'published' : 'draft';
    if (intent === 'draft' && (!field('title').value.trim() || !field('description').value.trim())) {
      if (!field('title').value.trim() && !field('description').value.trim()) {
        message('Write a title or description before saving a draft.', 'error');
        return;
      }
      persistLocalDraft();
      message('Incomplete draft saved on this device. Add a title and description to save it for both admins.', 'success');
      return;
    }
    if (!form.reportValidity()) return;
    const submit = event.submitter || form.querySelector('[type=submit]'); submit.disabled = true; message('Saving update…');
    try {
      for (let i = 0; i < attachments.length; i++) {
        const item = attachments[i];
        if (!item.file) continue;
        message(`Uploading media ${i + 1} of ${attachments.length}…`);
        const result = await api('/admin/api/uploads', {
          method: 'POST', headers: { 'Content-Type': item.file.type, 'X-File-Size': String(item.file.size) }, body: item.file
        });
        item.url = result.media_url;
        item.file = null;
      }
      const post = Object.fromEntries(['title', 'description', 'source_lang'].map((name) => [name, field(name).value]));
      post.status = intent;
      post.media = attachments.map((item) => ({ url: item.url, type: item.type }));
      post.image_url = post.media.find((item) => item.type === 'image')?.url || '';
      const id = field('id').value;
      message('Translating and saving update…');
      await api(id ? `/admin/api/posts/${encodeURIComponent(id)}` : '/admin/api/posts', { method: id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(post) });
      if (!id) clearLocalDraft();
      resetForm(); await load();
      message(post.status === 'published' ? 'Update published. It is live on the website.' : 'Draft saved. It is not visible on the public website.', 'success');
    } catch (error) { message(error.message || 'Could not save update.', 'error'); }
    finally { submit.disabled = false; }
  });
  function openNewPost(event) {
    event?.preventDefault();
    if (localDraft) { resumeLocalDraft(); return; }
    resetForm();
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function resumeLocalDraft() {
    if (!localDraft) return;
    resetForm();
    field('source_lang').value = localDraft.source_lang;
    field('title').value = localDraft.title;
    field('description').value = localDraft.description;
    document.getElementById('draft-note').textContent = 'Unfinished draft restored from this device. Reselect photos or videos if needed.';
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function discardLocalDraft() {
    if (!confirm('Discard the unfinished draft saved on this device? This cannot be undone.')) return;
    clearLocalDraft();
    if (!editingPost && !panel.hidden) resetForm();
    updateSummary(); renderList(); message('Unfinished draft discarded.', 'success');
  }
  form.addEventListener('input', persistLocalDraft);
  document.getElementById('new-post').addEventListener('click', openNewPost);
  document.getElementById('write-update-link').addEventListener('click', openNewPost);
  document.getElementById('cancel-edit').addEventListener('click', resetForm);
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => {
    filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((item) => item.classList.toggle('active', item === button));
    renderList();
  }));
  renderMedia();
  load().then(() => {
    // Deep link also works if an older cached script missed the sidebar click:
    // a full navigation to /admin/?compose=1 opens the editor after data loads.
    const params = new URLSearchParams(window.location.search);
    if (params.has('compose') || ['#editor-panel', '#editor-heading'].includes(window.location.hash)) {
      openNewPost();
    }
  }).catch((error) => message(`${error.message} Check Cloudflare Access, Pages bindings and the 0002 migration.`, 'error'));
})();
