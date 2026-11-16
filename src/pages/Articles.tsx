import { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { articles, type ArticleMeta, type EssayForm } from '../lib/articles';
import SEO from '../components/SEO';

const FORMS: Array<'All' | EssayForm> = ['All', 'Framework', 'Architecture', 'Principle'];
const label = 'font-mono text-[10px] uppercase tracking-[0.22em]';

export default function Articles() {
  const [filter, setFilter] = useState<'All' | EssayForm>('All');
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (filter !== 'All' || onlyFeatured || query !== '')) {
        setFilter('All');
        setOnlyFeatured(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [filter, onlyFeatured, query]);

  const formCounts = useMemo(() => {
    const counts: Record<'All' | EssayForm, number> = {
      All: articles.length,
      Framework: 0,
      Architecture: 0,
      Principle: 0,
    };
    for (const a of articles) {
      counts[a.form] = (counts[a.form] ?? 0) + 1;
    }
    return counts;
  }, []);

  const filteredArticles = useMemo(() => {
    const q = query.trim().toLowerCase();
    return articles.filter((a) => {
      if (filter !== 'All' && a.form !== filter) return false;
      if (onlyFeatured && !a.featured) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.excerpt.toLowerCase().includes(q) ||
        a.form.toLowerCase().includes(q) ||
        a.topics.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [filter, onlyFeatured, query]);

  const featuredCount = useMemo(() => filteredArticles.filter((a) => a.featured).length, [filteredArticles]);
  const totalReadingMinutes = useMemo(
    () => filteredArticles.reduce((acc, a) => acc + a.readingTime, 0),
    [filteredArticles],
  );
  const totalWords = useMemo(
    () => filteredArticles.reduce((acc, a) => acc + a.wordCount, 0),
    [filteredArticles],
  );
  const activeFormsCount = useMemo(
    () => new Set(filteredArticles.map((a) => a.form)).size,
    [filteredArticles],
  );
  const hasActiveFilters = filter !== 'All' || onlyFeatured || query.trim() !== '';

  return (
    <div className="min-h-screen overflow-x-clip pt-32 pb-24">
      <SEO
        title="Essays | Decision tools for AI systems designers"
        description="A small, curated shelf of frameworks, architecture maps, and principles for people who design production AI systems. Not a content firehose."
        canonicalUrl="https://www.adityaai.dev/articles"
        breadcrumbs={[
          { name: 'Home', url: 'https://www.adityaai.dev/' },
          { name: 'Essays', url: 'https://www.adityaai.dev/articles' },
        ]}
      />
      <section className="mx-auto max-w-6xl px-6 md:px-8 lg:px-12 py-12 md:py-16">
        <header className="relative mb-10 border-b border-zinc-800/60 pb-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 -left-12 h-64 w-64 max-w-full rounded-full bg-electric-lime/[0.04] blur-3xl sm:w-96"
          />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className={`${label} flex items-center gap-2.5 text-electric-lime`}>
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)]"
              />
              Essays · curated shelf
            </p>
            <span className="font-mono text-[11px] tabular-nums text-zinc-500">
              {articles.length} essays · restart {new Date().getFullYear()}
            </span>
          </div>

          <h1 className="mb-4 font-display text-[clamp(2.5rem,8vw,4rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-zinc-50">
            Decision tools for systems designers
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-400">
            A short shelf - not a stream. Each piece is meant to change how you architect agents, memory, cost, or the
            product surface.
          </p>

          {/* 4-Tile Shelf Telemetry Bar */}
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-800/60 lg:grid-cols-4">
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Curated shelf</dt>
              <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
                {filteredArticles.length}
              </dd>
              <p className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-400">
                {hasActiveFilters ? `filtered (of ${articles.length} essays)` : 'Long-form technical essays'}
              </p>
            </div>
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Start here set</dt>
              <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-electric-lime md:text-5xl">
                {featuredCount}
              </dd>
              <p className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-400">
                Foundational entry points
              </p>
            </div>
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Taxonomy</dt>
              <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
                {activeFormsCount}
              </dd>
              <p className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-400">
                Framework · Architecture · Principle
              </p>
            </div>
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Reading depth</dt>
              <dd className="mt-2 font-sans text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">
                {totalReadingMinutes} min
              </dd>
              <p className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-400">
                {totalWords.toLocaleString()} words across selection
              </p>
            </div>
          </dl>
        </header>

        {/* Interactive Shelf Toolbar */}
        <div className="mb-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label="Filter essays by form" className="flex flex-wrap items-center gap-2">
            {FORMS.map((form) => {
              const active = filter === form;
              return (
                <button
                  key={form}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(form)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime ${
                    active
                      ? 'border-electric-lime bg-electric-lime font-semibold text-zinc-950 shadow-[0_0_20px_rgba(202,255,74,0.2)]'
                      : 'border-zinc-800 bg-[#0a0a0a] text-zinc-400 hover:border-zinc-600 hover:text-zinc-100'
                  }`}
                >
                  <span>{form}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] tabular-nums ${
                      active ? 'bg-zinc-950/15 text-zinc-950' : 'bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    {formCounts[form]}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              aria-pressed={onlyFeatured}
              onClick={() => setOnlyFeatured((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime ${
                onlyFeatured
                  ? 'border-electric-lime bg-electric-lime/15 text-electric-lime'
                  : 'border-zinc-800 bg-[#0a0a0a] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
              }`}
            >
              <span aria-hidden className="size-1.5 rounded-full bg-electric-lime" />
              Start here ({articles.filter((a) => a.featured).length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64 sm:flex-initial">
              <Search
                size={13}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search title or topic..."
                aria-label="Search essays"
                className="w-full rounded-full border border-zinc-800 bg-[#0a0a0a] py-1.5 pr-8 pl-9 font-mono text-xs text-zinc-200 placeholder:text-zinc-500 transition-colors focus:border-electric-lime focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear essay search"
                  className="absolute top-1/2 right-1 -translate-y-1/2 flex size-7 items-center justify-center rounded-full text-zinc-500 hover:text-zinc-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={() => {
                  setFilter('All');
                  setOnlyFeatured(false);
                  setQuery('');
                }}
                className="font-mono text-[10px] uppercase tracking-widest text-electric-lime hover:underline"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] p-12 text-center">
            <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
              No essays on the shelf match your filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setFilter('All');
                setOnlyFeatured(false);
                setQuery('');
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-electric-lime px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-electric-lime transition-colors hover:bg-electric-lime hover:text-zinc-950"
            >
              Reset shelf filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8 items-start">
            <div className="flex flex-col gap-6 md:gap-8">
              {filteredArticles.map((article, i) =>
                i % 2 === 0 ? <ArticleCard key={article.slug} article={article} index={i} /> : null,
              )}
            </div>
            <div className="flex flex-col gap-6 md:gap-8 md:mt-14">
              {filteredArticles.map((article, i) =>
                i % 2 !== 0 ? <ArticleCard key={article.slug} article={article} index={i} /> : null,
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ArticleCard({ article, index }: { article: ArticleMeta; index: number }) {
  const delay = index < 8 ? `${index * 0.06}s` : '0s';
  return (
    <div
      className="animate-fade-up motion-reduce:animate-none"
      style={{ animationDelay: delay, animationFillMode: 'both' }}
    >
      <Link
        to={`/articles/${article.slug}`}
        className="group relative block overflow-hidden rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] p-6 md:p-8 transition-all duration-300 hover:border-electric-lime/50 hover:bg-zinc-900/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent transition-opacity group-hover:via-electric-lime/50"
        />

        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-electric-lime">
              <span aria-hidden className="size-1.5 rounded-full bg-electric-lime" />
              {article.form}
            </span>
            {article.featured && (
              <span className="rounded-md border border-electric-lime/30 bg-electric-lime/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-electric-lime">
                Start here
              </span>
            )}
            <span className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-zinc-400">
              {article.readingTime} min · {article.wordCount.toLocaleString()}w
            </span>
          </div>
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-800/80 bg-zinc-950 text-zinc-500 transition-colors group-hover:border-electric-lime/50 group-hover:text-electric-lime">
            <ArrowUpRight
              size={15}
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>
        </div>

        <h2 className="mb-3 font-display text-xl font-semibold leading-snug text-zinc-100 transition-colors group-hover:text-white md:text-2xl">
          {article.title}
        </h2>
        <p className="mb-6 line-clamp-3 text-sm font-light leading-relaxed text-zinc-400">
          {article.excerpt}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-900 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {article.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-zinc-800/80 bg-zinc-950 px-2.5 py-0.5 font-mono text-[10px] text-zinc-400"
              >
                {topic}
              </span>
            ))}
          </div>
          <time
            dateTime={article.dateISO}
            className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-zinc-500"
          >
            {article.date}
          </time>
        </div>
      </Link>
    </div>
  );
}
