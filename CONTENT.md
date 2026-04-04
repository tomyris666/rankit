# Adding Content — Rankit Consultancy

This document covers exactly what to update when adding new content so that the sidebar tree, mobile bottom sheets, search bar, breadcrumbs, section TOC, and preview cards all continue to work automatically.

---

## How the site is wired

Everything flows from a single source of truth:

```
src/data/notes-tree.ts  →  drives the sidebar tree, mobile sheets, breadcrumbs, search
src/pages/<sub-slug>/<article-slug>.astro  →  the actual page content
```

The search bar reads `data-title` and `data-tags` attributes that are stamped onto each tree link at build time from `notes-tree.ts`. The section TOC ("On this page") reads `h2.note-heading` elements directly from the article page at runtime — no registration needed.

---

## Scenarios

### A — Add an article to an existing subcategory

This is the most common operation. Two steps.

**Step 1 — Register the article in `src/data/notes-tree.ts`**

Find the correct subcategory and add an entry to its `articles` array:

```ts
{
  name: 'SEO',
  slug: 'seo',
  articles: [
    // existing articles...
    {
      title: 'Your Article Title',       // shown in sidebar, search results, preview card
      slug: 'your-article-slug',         // must match the .astro filename exactly
      summary: 'One or two sentences.',  // shown in search results and preview card
    },
  ],
},
```

**Step 2 — Create `src/pages/<sub-slug>/<article-slug>.astro`**

The folder name must match the subcategory `slug`. The filename must match the article `slug`.

```astro
---
import NoteLayout from '../../layouts/NoteLayout.astro';

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Your Article Title',
  description: 'Same as your summary.',
  author: { '@type': 'Organization', name: 'Rankit Consultancy' },
  datePublished: '2026-01-01',
};
---
<NoteLayout
  title="Your Article Title"
  description="Same as your summary."
  articleSlug="your-article-slug"
  schema={schema}
>
  <p class="description scribble-target">Opening paragraph.</p>

  <h2 class="note-heading">First Section</h2>
  <p class="note-text">Content here.</p>

  <h2 class="note-heading">Second Section</h2>
  <ul class="note-list">
    <li>Point one.</li>
    <li>Point two.</li>
  </ul>
</NoteLayout>
```

That's it. The sidebar, search, breadcrumb, and mobile sheets update automatically.

**The URL will be:** `/<sub-slug>/<article-slug>/`

---

### B — Add a new subcategory to an existing top-level category

Two steps — no article page needed yet.

**Step 1 — Add the subcategory to `src/data/notes-tree.ts`**

Find the parent category and add to its `children` array:

```ts
{
  name: 'Digital Marketing',
  slug: 'digital-marketing',
  children: [
    // existing subcategories...
    {
      name: 'Paid Media',       // label shown in the sidebar
      slug: 'paid-media',       // used in URLs: /paid-media/<article-slug>/
      articles: [],             // empty until you add articles (Scenario A)
    },
  ],
},
```

**Step 2 — Create the folder** `src/pages/paid-media/` when you add the first article inside it (Astro creates routes from the filesystem).

Search tags for every article in this subcategory will automatically include both the parent name ("Digital Marketing") and subcategory name ("Paid Media").

---

### C — Add a new top-level category

One step — no page files needed until articles exist.

**Add a new entry to the top-level array in `src/data/notes-tree.ts`:**

```ts
export const notesTree: TreeCategory[] = [
  { name: 'Digital Marketing', ... },
  { name: 'Artificial Intelligence', ... },

  // Add here:
  {
    name: 'Data Science',
    slug: 'data-science',
    children: [
      {
        name: 'Python',
        slug: 'python',
        articles: [],
      },
    ],
  },
];
```

The new category appears immediately in the sidebar tree and mobile Browse Notes sheet. It will also appear as a search tag on any articles you add beneath it.

---

## Article page reference

### Required props on `<NoteLayout>`

| Prop | Value |
|---|---|
| `title` | Matches `title` in `notes-tree.ts` |
| `description` | Matches `summary` in `notes-tree.ts` |
| `articleSlug` | Matches `slug` in `notes-tree.ts` — used for breadcrumbs and active state |
| `schema` | JSON-LD object — always include `headline`, `description`, `author`, `datePublished` |

### Content classes

These classes must be used for the TOC, styling, and scribble animation to work:

| Element | Class |
|---|---|
| Opening paragraph | `class="description scribble-target"` |
| Section headings (H2) | `class="note-heading"` — each becomes a TOC entry |
| Body paragraph | `class="note-text"` |
| Bullet list | `class="note-list"` |

### Section TOC ("On this page")

The TOC sidebar (desktop) and the "On this page" mobile sheet are both populated automatically at runtime by reading every `h2.note-heading` inside the article. No registration needed — just use the class.

Each heading gets a generated `id` from its text content (lowercased, spaces replaced with hyphens) so anchor links work.

---

## What updates automatically (you do not touch these)

| Feature | Driven by |
|---|---|
| Sidebar tree | `notes-tree.ts` |
| Mobile "Browse Notes" sheet | `notes-tree.ts` |
| Search bar (title + tag matching) | `notes-tree.ts` → `data-title`, `data-tags` stamped at build |
| Preview card (title, summary, shape) | `notes-tree.ts` → `data-summary`, `data-category` |
| Breadcrumb on article page | `notes-tree.ts` via `getAllArticles()` |
| "On this page" TOC (desktop + mobile) | `h2.note-heading` elements in the article page |
| Sitemap | Astro reads `src/pages/**` automatically |

---

## Checklist for a new article

- [ ] Entry added to `notes-tree.ts` with `title`, `slug`, `summary`
- [ ] `slug` in `notes-tree.ts` matches the `.astro` filename exactly
- [ ] Folder name matches the subcategory `slug`
- [ ] `articleSlug` prop on `<NoteLayout>` matches `slug` in `notes-tree.ts`
- [ ] `title` and `description` props match `notes-tree.ts`
- [ ] At least one `h2.note-heading` in the content (for the TOC to appear)
- [ ] `datePublished` in the schema is accurate
