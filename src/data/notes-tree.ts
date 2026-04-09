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
          {
            title: 'Link Building in 2026: What Actually Moves Rankings',
            slug: 'link-building-in-2026',
            summary: 'Generic outreach is dead. This guide covers what link acquisition looks like in a post-Penguin, AI-summary world — and which tactics are still worth the effort.',
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
          {
            title: 'Building a Reporting Stack from Scratch',
            slug: 'building-a-reporting-stack',
            summary: 'From raw event data to executive dashboard: a practical guide to building a reporting stack with GA4, BigQuery, and Looker Studio.',
          },
        ],
      },
      {
        name: 'Content Strategy',
        slug: 'content-strategy',
        articles: [
          {
            title: 'Content Decay: Why Your Best Posts Stop Working',
            slug: 'content-decay',
            summary: 'Traffic plateaus, then drops. Here\'s the anatomy of content decay — why it happens, how to spot it early, and a framework for refreshing posts before rankings slip.',
          },
          {
            title: 'Building a Topical Authority Map',
            slug: 'topical-authority-map',
            summary: 'How to map your site\'s content against a topic cluster model and identify the gaps that prevent Google from treating you as a category authority.',
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
          {
            title: 'Chain-of-Thought vs Zero-Shot: A Practical Comparison',
            slug: 'chain-of-thought-vs-zero-shot',
            summary: 'A practical comparison of prompting strategies: when chain-of-thought reasoning adds value, and when it is just overhead.',
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
          {
            title: 'When to Trust the Model and When Not To',
            slug: 'when-to-trust-the-model',
            summary: 'A framework for deciding when AI-generated output is reliable enough to act on, and when human review is non-negotiable.',
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
