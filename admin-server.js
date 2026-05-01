#!/usr/bin/env node
/**
 * Rankit Admin Server — run with: node admin-server.js
 * Serves on http://localhost:3333
 *
 * Drafts  → src/drafts/<slug>.json  (not built by Astro)
 * Publish → src/pages/<category>/<slug>.astro + updates notes-tree.ts
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRAFTS_DIR = path.join(__dirname, 'src', 'drafts');
const PAGES_DIR = path.join(__dirname, 'src', 'pages');
const TREE_FILE = path.join(__dirname, 'src', 'data', 'notes-tree.ts');
const PORT = 3333;

// Category slug → { parentSlug, parentName, catName }
const CATEGORIES = {
  'seo':               { parentSlug: 'digital-marketing', parentName: 'Digital Marketing', catName: 'SEO' },
  'analytics':         { parentSlug: 'digital-marketing', parentName: 'Digital Marketing', catName: 'Analytics' },
  'content-strategy':  { parentSlug: 'digital-marketing', parentName: 'Digital Marketing', catName: 'Content Strategy' },
  'prompt-engineering':{ parentSlug: 'artificial-intelligence', parentName: 'Artificial Intelligence', catName: 'Prompt Engineering' },
  'ai-general':        { parentSlug: 'artificial-intelligence', parentName: 'Artificial Intelligence', catName: 'General' },
};

fs.mkdirSync(DRAFTS_DIR, { recursive: true });

// ── Helpers ──────────────────────────────────────────────────────────────────

function listDrafts() {
  return fs.readdirSync(DRAFTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      try { return JSON.parse(fs.readFileSync(path.join(DRAFTS_DIR, f), 'utf8')); }
      catch { return null; }
    })
    .filter(Boolean);
}

function getDraft(slug) {
  const fp = path.join(DRAFTS_DIR, `${slug}.json`);
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function saveDraft(data) {
  const fp = path.join(DRAFTS_DIR, `${data.slug}.json`);
  fs.writeFileSync(fp, JSON.stringify(data, null, 2));
}

function deleteDraft(slug) {
  const fp = path.join(DRAFTS_DIR, `${slug}.json`);
  if (fs.existsSync(fp)) fs.unlinkSync(fp);
}

function buildAstroFile(data) {
  const { title, description, slug, category, content, datePublished } = data;
  const date = datePublished || new Date().toISOString().slice(0, 10);
  return `---
import NoteLayout from '../../layouts/NoteLayout.astro';

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: ${JSON.stringify(title)},
  description: ${JSON.stringify(description)},
  author: { '@type': 'Organization', name: 'Rankit Consultancy' },
  datePublished: '${date}',
};
---
<NoteLayout
  title=${JSON.stringify(title)}
  description=${JSON.stringify(description)}
  articleSlug=${JSON.stringify(slug)}
  schema={schema}
>
${content.trim()}
</NoteLayout>
`;
}

function addToNotesTree(data) {
  const { title, slug, summary, category } = data;
  const src = fs.readFileSync(TREE_FILE, 'utf8');

  // Find the articles array for this category slug and append to it
  // We look for the slug entry like: slug: 'seo',
  // then find its articles array and push a new entry before the closing ]
  const catMeta = CATEGORIES[category];
  if (!catMeta) return;

  // Check if slug already exists
  if (src.includes(`slug: '${slug}'`)) return;

  // Naive but reliable: find "slug: '<category>'" then find the next "articles: [" then its closing "],"
  const catSlugMarker = `slug: '${category}',`;
  const catIdx = src.indexOf(catSlugMarker);
  if (catIdx === -1) return;

  const articlesMarker = 'articles: [';
  const artStart = src.indexOf(articlesMarker, catIdx);
  if (artStart === -1) return;

  // Find the matching closing ] for this articles array
  let depth = 0;
  let i = artStart + articlesMarker.length - 1;
  while (i < src.length) {
    if (src[i] === '[') depth++;
    else if (src[i] === ']') {
      depth--;
      if (depth === 0) break;
    }
    i++;
  }

  const newEntry = `          {
            title: ${JSON.stringify(title)},
            slug: '${slug}',
            summary: ${JSON.stringify(summary)},
            image: DEFAULT_IMAGE,
          },
        `;

  const updated = src.slice(0, i) + newEntry + src.slice(i);
  fs.writeFileSync(TREE_FILE, updated);
}

function publishDraft(slug) {
  const draft = getDraft(slug);
  if (!draft) return { ok: false, error: 'Draft not found' };
  const { category } = draft;
  if (!CATEGORIES[category]) return { ok: false, error: `Unknown category: ${category}` };

  const dir = path.join(PAGES_DIR, category);
  fs.mkdirSync(dir, { recursive: true });

  const outPath = path.join(dir, `${slug}.astro`);
  fs.writeFileSync(outPath, buildAstroFile(draft));

  addToNotesTree(draft);
  deleteDraft(slug);

  return { ok: true, path: outPath };
}

// ── Request body parser ───────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { resolve({}); }
    });
    req.on('error', reject);
  });
}

// ── HTML UI ───────────────────────────────────────────────────────────────────

const HTML = /* html */`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Rankit Admin</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0f0f0f;
    --surface: #191919;
    --border: #2a2a2a;
    --text: #e8e8e8;
    --muted: #666;
    --accent: #722f37;
    --accent-light: #9a3e48;
    --success: #3a7d44;
    --font: 'JetBrains Mono', 'Courier New', monospace;
  }
  body { font-family: var(--font); background: var(--bg); color: var(--text); min-height: 100vh; font-size: 14px; line-height: 1.6; }
  a { color: var(--accent-light); text-decoration: none; }
  a:hover { text-decoration: underline; }

  /* Layout */
  .layout { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }
  .sidebar { background: var(--surface); border-right: 1px solid var(--border); padding: 1.5rem 1.25rem; display: flex; flex-direction: column; gap: 1.5rem; }
  .main { padding: 2rem 2.5rem; max-width: 820px; }

  /* Sidebar */
  .logo { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.3em; text-transform: uppercase; color: var(--muted); }
  .sidebar-nav { display: flex; flex-direction: column; gap: 0.25rem; }
  .sidebar-btn { background: none; border: none; color: var(--muted); font-family: var(--font); font-size: 0.72rem; letter-spacing: 0.08em; text-align: left; padding: 0.45rem 0.6rem; cursor: pointer; border-left: 2px solid transparent; transition: color 0.15s, border-color 0.15s; text-transform: uppercase; }
  .sidebar-btn:hover, .sidebar-btn.active { color: var(--text); border-left-color: var(--accent); }
  .drafts-list { display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.5rem; }
  .draft-item { background: none; border: none; color: var(--muted); font-family: var(--font); font-size: 0.68rem; text-align: left; padding: 0.35rem 0.6rem 0.35rem 1rem; cursor: pointer; border-left: 2px solid transparent; transition: color 0.15s; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .draft-item:hover { color: var(--text); border-left-color: var(--border); }
  .drafts-label { font-size: 0.58rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); padding: 0 0.6rem; margin-top: 0.5rem; }

  /* Main panel */
  .panel { display: none; }
  .panel.active { display: block; }

  h2 { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase; color: var(--muted); margin-bottom: 1.5rem; }

  .form-grid { display: flex; flex-direction: column; gap: 1.25rem; }
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  .field { display: flex; flex-direction: column; gap: 0.4rem; }
  label { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
  input, select, textarea {
    font-family: var(--font);
    font-size: 0.8rem;
    color: var(--text);
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 0.6rem 0.75rem;
    outline: none;
    resize: vertical;
    width: 100%;
    transition: border-color 0.15s;
  }
  input:focus, select:focus, textarea:focus { border-color: var(--accent); }
  select option { background: var(--surface); }
  textarea { min-height: 380px; font-size: 0.76rem; line-height: 1.7; }

  .actions { display: flex; gap: 0.75rem; margin-top: 1rem; align-items: center; }
  .btn { font-family: var(--font); font-size: 0.68rem; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; border: 1px solid; padding: 0.55rem 1.1rem; cursor: pointer; transition: background 0.15s, color 0.15s; }
  .btn-draft { background: none; color: var(--muted); border-color: var(--border); }
  .btn-draft:hover { color: var(--text); border-color: var(--muted); }
  .btn-publish { background: var(--accent); color: #fff; border-color: var(--accent); }
  .btn-publish:hover { background: var(--accent-light); border-color: var(--accent-light); }
  .btn-delete { background: none; color: #844; border-color: #422; font-size: 0.62rem; }
  .btn-delete:hover { color: #c55; border-color: #844; }

  .status { font-size: 0.7rem; color: var(--muted); margin-left: 0.5rem; }
  .status.ok { color: var(--success); }
  .status.err { color: #c55; }

  /* Draft list panel */
  .drafts-table { width: 100%; border-collapse: collapse; }
  .drafts-table th { font-size: 0.58rem; letter-spacing: 0.15em; text-transform: uppercase; color: var(--muted); text-align: left; padding: 0.4rem 0.75rem; border-bottom: 1px solid var(--border); }
  .drafts-table td { font-size: 0.74rem; padding: 0.65rem 0.75rem; border-bottom: 1px solid var(--border); vertical-align: middle; }
  .drafts-table tr:hover td { background: rgba(255,255,255,0.02); }
  .tag { font-size: 0.58rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.2rem 0.5rem; background: rgba(114,47,55,0.2); color: var(--accent-light); border: 1px solid rgba(114,47,55,0.3); }
  .empty { color: var(--muted); font-size: 0.74rem; padding: 2rem 0; }
</style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    <div class="logo">Rankit Admin</div>
    <nav class="sidebar-nav">
      <button class="sidebar-btn active" data-panel="new">+ New Post</button>
      <button class="sidebar-btn" data-panel="drafts">Drafts</button>
    </nav>
    <div>
      <div class="drafts-label">Saved Drafts</div>
      <div class="drafts-list" id="sidebar-drafts"></div>
    </div>
  </aside>

  <main class="main">
    <!-- New / Edit post panel -->
    <div class="panel active" id="panel-new">
      <h2 id="editor-heading">New Post</h2>
      <div class="form-grid">
        <div class="form-row">
          <div class="field">
            <label for="f-title">Title</label>
            <input id="f-title" type="text" placeholder="Post title" />
          </div>
          <div class="field">
            <label for="f-slug">Slug</label>
            <input id="f-slug" type="text" placeholder="post-slug" />
          </div>
        </div>
        <div class="form-row">
          <div class="field">
            <label for="f-category">Category</label>
            <select id="f-category">
              <option value="seo">SEO</option>
              <option value="analytics">Analytics</option>
              <option value="content-strategy">Content Strategy</option>
              <option value="prompt-engineering">Prompt Engineering</option>
              <option value="ai-general">AI — General</option>
            </select>
          </div>
          <div class="field">
            <label for="f-date">Date</label>
            <input id="f-date" type="date" />
          </div>
        </div>
        <div class="field">
          <label for="f-summary">Summary (shown in listings)</label>
          <input id="f-summary" type="text" placeholder="One-sentence summary" />
        </div>
        <div class="field">
          <label for="f-description">Meta description (SEO)</label>
          <input id="f-description" type="text" placeholder="SEO meta description" />
        </div>
        <div class="field">
          <label for="f-content">Content (Astro/HTML)</label>
          <textarea id="f-content" placeholder='<p class="description scribble-target">Intro paragraph...</p>

<h2 class="note-heading">Section Title</h2>
<p class="note-text">Body text here.</p>'></textarea>
        </div>
        <div class="actions">
          <button class="btn btn-draft" id="btn-save-draft">Save Draft</button>
          <button class="btn btn-publish" id="btn-publish">Publish</button>
          <button class="btn btn-delete" id="btn-discard" style="display:none">Discard Draft</button>
          <span class="status" id="status-msg"></span>
        </div>
      </div>
    </div>

    <!-- Drafts list panel -->
    <div class="panel" id="panel-drafts">
      <h2>Drafts</h2>
      <div id="drafts-content"></div>
    </div>
  </main>
</div>

<script>
  const $ = id => document.getElementById(id);
  let editingSlug = null;

  // ── Panel switching ───────────────────────────────────────────────────────
  document.querySelectorAll('.sidebar-btn[data-panel]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      $('panel-' + btn.dataset.panel).classList.add('active');
      if (btn.dataset.panel === 'drafts') loadDraftsPanel();
      if (btn.dataset.panel === 'new' && !editingSlug) clearForm();
    });
  });

  // ── Auto-slug from title ──────────────────────────────────────────────────
  $('f-title').addEventListener('input', () => {
    if (editingSlug) return;
    $('f-slug').value = $('f-title').value
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  });

  // ── Set today's date by default ───────────────────────────────────────────
  $('f-date').value = new Date().toISOString().slice(0, 10);

  // ── Status helper ─────────────────────────────────────────────────────────
  function setStatus(msg, type) {
    const el = $('status-msg');
    el.textContent = msg;
    el.className = 'status ' + (type || '');
    if (type === 'ok') setTimeout(() => { el.textContent = ''; el.className = 'status'; }, 3000);
  }

  // ── Collect form data ─────────────────────────────────────────────────────
  function formData() {
    return {
      title:         $('f-title').value.trim(),
      slug:          $('f-slug').value.trim(),
      category:      $('f-category').value,
      datePublished: $('f-date').value,
      summary:       $('f-summary').value.trim(),
      description:   $('f-description').value.trim(),
      content:       $('f-content').value,
    };
  }

  function validateDraft(d) {
    if (!d.title) { setStatus('Title is required', 'err'); return false; }
    if (!d.slug)  { setStatus('Slug is required', 'err'); return false; }
    return true;
  }

  function validatePublish(d) {
    if (!d.title)   { setStatus('Title is required', 'err'); return false; }
    if (!d.slug)    { setStatus('Slug is required', 'err'); return false; }
    if (!d.summary) { setStatus('Summary is required to publish', 'err'); return false; }
    if (!d.content) { setStatus('Content is required to publish', 'err'); return false; }
    return true;
  }

  // ── Save Draft ────────────────────────────────────────────────────────────
  $('btn-save-draft').addEventListener('click', async () => {
    const d = formData();
    if (!validateDraft(d)) return;
    setStatus('Saving…');
    const r = await fetch('/api/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    const j = await r.json();
    if (j.ok) {
      editingSlug = d.slug;
      $('editor-heading').textContent = 'Editing: ' + d.slug;
      $('btn-discard').style.display = '';
      setStatus('Draft saved.', 'ok');
      refreshSidebarDrafts();
    } else {
      setStatus(j.error || 'Error', 'err');
    }
  });

  // ── Publish ───────────────────────────────────────────────────────────────
  $('btn-publish').addEventListener('click', async () => {
    const d = formData();
    if (!validatePublish(d)) return;
    // Save draft first, then publish
    setStatus('Publishing…');
    await fetch('/api/draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) });
    const r = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: d.slug }) });
    const j = await r.json();
    if (j.ok) {
      setStatus('Published → ' + j.path.split('/src/')[1], 'ok');
      editingSlug = null;
      setTimeout(clearForm, 1500);
      refreshSidebarDrafts();
    } else {
      setStatus(j.error || 'Error', 'err');
    }
  });

  // ── Discard draft ─────────────────────────────────────────────────────────
  $('btn-discard').addEventListener('click', async () => {
    if (!editingSlug) return;
    if (!confirm('Delete draft "' + editingSlug + '"?')) return;
    await fetch('/api/draft/' + editingSlug, { method: 'DELETE' });
    clearForm();
    refreshSidebarDrafts();
  });

  // ── Load draft into editor ────────────────────────────────────────────────
  function loadDraftIntoEditor(d) {
    $('f-title').value       = d.title || '';
    $('f-slug').value        = d.slug || '';
    $('f-category').value    = d.category || 'seo';
    $('f-date').value        = d.datePublished || new Date().toISOString().slice(0, 10);
    $('f-summary').value     = d.summary || '';
    $('f-description').value = d.description || '';
    $('f-content').value     = d.content || '';
    editingSlug = d.slug;
    $('editor-heading').textContent = 'Editing: ' + d.slug;
    $('btn-discard').style.display = '';
    setStatus('');
    // Switch to editor panel
    document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.sidebar-btn[data-panel="new"]').classList.add('active');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    $('panel-new').classList.add('active');
  }

  function clearForm() {
    $('f-title').value       = '';
    $('f-slug').value        = '';
    $('f-category').value    = 'seo';
    $('f-date').value        = new Date().toISOString().slice(0, 10);
    $('f-summary').value     = '';
    $('f-description').value = '';
    $('f-content').value     = '';
    editingSlug = null;
    $('editor-heading').textContent = 'New Post';
    $('btn-discard').style.display = 'none';
    setStatus('');
  }

  // ── Drafts panel ──────────────────────────────────────────────────────────
  async function loadDraftsPanel() {
    const r = await fetch('/api/drafts');
    const drafts = await r.json();
    const el = $('drafts-content');
    if (!drafts.length) { el.innerHTML = '<p class="empty">No drafts saved.</p>'; return; }
    el.innerHTML = '<table class="drafts-table"><thead><tr><th>Title</th><th>Category</th><th>Slug</th><th>Date</th><th></th></tr></thead><tbody>' +
      drafts.map(d => \`<tr>
        <td><button class="sidebar-btn" style="border:none;padding:0;font-size:0.74rem;text-transform:none;letter-spacing:0;color:var(--text)" onclick="editDraft('\${d.slug}')">\${d.title}</button></td>
        <td><span class="tag">\${d.category}</span></td>
        <td style="color:var(--muted);font-size:0.68rem">\${d.slug}</td>
        <td style="color:var(--muted);font-size:0.68rem">\${d.datePublished || '—'}</td>
        <td>
          <button class="btn btn-publish" style="padding:0.3rem 0.7rem;font-size:0.6rem" onclick="publishDraft('\${d.slug}')">Publish</button>
          &nbsp;
          <button class="btn btn-delete" style="padding:0.3rem 0.7rem" onclick="deleteDraft('\${d.slug}')">Delete</button>
        </td>
      </tr>\`).join('') +
      '</tbody></table>';
  }

  window.editDraft = async (slug) => {
    const r = await fetch('/api/draft/' + slug);
    const d = await r.json();
    loadDraftIntoEditor(d);
  };

  window.publishDraft = async (slug) => {
    if (!confirm('Publish "' + slug + '" now?')) return;
    const r = await fetch('/api/publish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) });
    const j = await r.json();
    if (j.ok) { loadDraftsPanel(); refreshSidebarDrafts(); alert('Published → src/' + j.path.split('/src/')[1]); }
    else alert('Error: ' + j.error);
  };

  window.deleteDraft = async (slug) => {
    if (!confirm('Delete draft "' + slug + '"?')) return;
    await fetch('/api/draft/' + slug, { method: 'DELETE' });
    loadDraftsPanel();
    refreshSidebarDrafts();
  };

  // ── Sidebar drafts list ───────────────────────────────────────────────────
  async function refreshSidebarDrafts() {
    const r = await fetch('/api/drafts');
    const drafts = await r.json();
    const el = $('sidebar-drafts');
    el.innerHTML = drafts.length
      ? drafts.map(d => \`<button class="draft-item" onclick="editDraft('\${d.slug}')">\${d.title}</button>\`).join('')
      : '<span style="font-size:0.65rem;color:var(--muted);padding:0.25rem 0.6rem;display:block">No drafts</span>';
  }

  refreshSidebarDrafts();
</script>
</body>
</html>`;

// ── HTTP server ───────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method;

  const json = (data, status = 200) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };

  const html = (body) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(body);
  };

  // UI
  if (method === 'GET' && url.pathname === '/') return html(HTML);

  // GET /api/drafts
  if (method === 'GET' && url.pathname === '/api/drafts') return json(listDrafts());

  // GET /api/draft/:slug
  if (method === 'GET' && url.pathname.startsWith('/api/draft/')) {
    const slug = url.pathname.slice('/api/draft/'.length);
    const d = getDraft(slug);
    return d ? json(d) : json({ error: 'Not found' }, 404);
  }

  // POST /api/draft
  if (method === 'POST' && url.pathname === '/api/draft') {
    const body = await readBody(req);
    if (!body.slug) return json({ ok: false, error: 'slug required' }, 400);
    saveDraft(body);
    return json({ ok: true });
  }

  // DELETE /api/draft/:slug
  if (method === 'DELETE' && url.pathname.startsWith('/api/draft/')) {
    const slug = url.pathname.slice('/api/draft/'.length);
    deleteDraft(slug);
    return json({ ok: true });
  }

  // POST /api/publish
  if (method === 'POST' && url.pathname === '/api/publish') {
    const body = await readBody(req);
    const result = publishDraft(body.slug);
    return json(result);
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\nRankit Admin running at http://localhost:${PORT}\n`);
  console.log(`  Drafts → src/drafts/`);
  console.log(`  Publish → src/pages/<category>/<slug>.astro + updates notes-tree.ts\n`);
});
