export interface TreeArticle {
  title: string;
  slug: string;
  summary: string;
  image?: string;
  imagePosition?: string;
}

export interface TreeCategory {
  name: string;
  slug: string;
  children?: TreeCategory[];
  articles?: TreeArticle[];
}

const DEFAULT_IMAGE = '/images/article-default.svg';

export const notesTree: TreeCategory[] = [
  {
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    children: [
      {
        name: 'General',
        slug: 'ai-general',
        articles: [
          {
            title: 'The Slopocalypse',
            slug: 'the-slopocalypse',
            summary: 'AI slop is not new — it predates LLMs by decades. The real problem was never origin. It was always meaning.',
            image: '/images/slopocalypse/spider_slop.webp',
            imagePosition: '50% 15%',
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
