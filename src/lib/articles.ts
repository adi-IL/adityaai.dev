/// <reference types="vite/client" />

import articlesMeta from '../../scripts/articles-meta.json';

/** Essay form - decision-tool taxonomy (replaces Research/Article/Blog). */
export type EssayForm = 'Framework' | 'Architecture' | 'Principle';

/** @deprecated Use EssayForm */
export type ArticleCategory = EssayForm;

export interface ArticleMeta {
  slug: string;
  title: string;
  excerpt: string;
  /** Display date, e.g. "MAR 25, 2026" */
  date: string;
  /** ISO calendar date YYYY-MM-DD (timezone-stable) */
  dateISO: string;
  /** Framework | Architecture | Principle */
  form: EssayForm;
  /** Alias of form for older UI paths */
  category: EssayForm;
  topics: string[];
  featured: boolean;
  readingTime: number;
  wordCount: number;
}

export interface Article extends ArticleMeta {
  content: string;
}

/** Listing metadata only - full markdown bodies are lazy-loaded per slug. */
export const articles: ArticleMeta[] = (articlesMeta as ArticleMeta[]).map((a) => ({
  ...a,
  form: a.form || a.category,
  category: a.form || a.category,
  topics: a.topics || [],
  featured: Boolean(a.featured),
}));

export const featuredArticles = articles.filter((a) => a.featured);

const contentLoaders = import.meta.glob('/src/content/articles/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

function contentPathForSlug(slug: string): string {
  return `/src/content/articles/${slug}.md`;
}

function stripFrontmatter(raw: string): string {
  if (!raw.startsWith('---\n') && !raw.startsWith('---\r\n')) return raw;
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return raw;
  return raw.slice(end + 4).replace(/^\r?\n/, '');
}

export function getArticleMeta(slug: string): ArticleMeta | undefined {
  return articles.find((a) => a.slug === slug);
}

/** Lazy-load full markdown body for a single article. */
export async function loadArticle(slug: string): Promise<Article | null> {
  const meta = getArticleMeta(slug);
  if (!meta) return null;

  const loader = contentLoaders[contentPathForSlug(slug)];
  if (!loader) return null;

  const raw = await loader();
  return {
    ...meta,
    content: stripFrontmatter(raw),
  };
}
