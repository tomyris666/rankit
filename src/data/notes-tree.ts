export interface TreeArticle {
  title: string;
  slug: string;
  summary: string;
}

export interface TreeCategory {
  name: string;
  slug: string;
  children?: TreeCategory[];
  articles?: TreeArticle[];
}

export const notesTree: TreeCategory[] = [
  {
    name: 'Digital Marketing',
    slug: 'digital-marketing',
    children: [
      {
        name: 'SEO',
        slug: 'seo',
        articles: [
          {
            title: 'Technical SEO Checklist for 2026',
            slug: 'technical-seo-checklist-2026',
            summary: 'A comprehensive checklist covering crawlability, indexation, Core Web Vitals, structured data, and the latest ranking factors for 2026.',
          },
        ],
      },
      {
        name: 'Analytics',
        slug: 'analytics',
        articles: [
          {
            title: 'GA4 Migration Playbook',
            slug: 'ga4-migration-playbook',
            summary: 'Step-by-step guide to migrating from Universal Analytics to GA4 — data streams, events, conversions, and reporting.',
          },
        ],
      },
    ],
  },
  {
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    children: [
      {
        name: 'Prompt Engineering',
        slug: 'prompt-engineering',
        articles: [
          {
            title: 'The Bowling Alley Model',
            slug: 'the-bowling-alley-model',
            summary: 'A mental model for prompt engineering: the lane, the ball, and why precision matters more than power when working with language models.',
          },
        ],
      },
      {
        name: 'General',
        slug: 'ai-general',
        articles: [
          {
            title: 'The Commodification of Content',
            slug: 'the-commodification-of-content',
            summary: 'When AI makes content infinitely cheap to produce, what happens to its value? An argument for why the lane is narrowing for generic content — and what survives.',
          },
        ],
      },
    ],
  },
];

/** Build a flat list of all articles with their full URL paths.
 *  URLs use the leaf category slug: /<sub-slug>/<article-slug>/
 */
export function getAllArticles(): { article: TreeArticle; path: string; categoryPath: string[] }[] {
  const results: { article: TreeArticle; path: string; categoryPath: string[] }[] = [];

  function walk(categories: TreeCategory[], parentNames: string[]) {
    for (const cat of categories) {
      const names = [...parentNames, cat.name];
      if (cat.articles) {
        for (const article of cat.articles) {
          results.push({
            article,
            path: `/${cat.slug}/${article.slug}/`,
            categoryPath: names,
          });
        }
      }
      if (cat.children) {
        walk(cat.children, names);
      }
    }
  }

  walk(notesTree, []);
  return results;
}
