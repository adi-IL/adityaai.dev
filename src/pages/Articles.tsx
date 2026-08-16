import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { articles, type ArticleMeta, type EssayForm } from '../lib/articles';
import SEO from '../components/SEO';

const FORMS: Array<'All' | EssayForm> = ['All', 'Framework', 'Architecture', 'Principle'];

export default function Articles() {
  const [filter, setFilter] = useState<'All' | EssayForm>('All');

  const filteredArticles = articles.filter(
    (article) => filter === 'All' || article.form === filter,
  );

  return (
    <div className="min-h-screen pt-32 pb-16">
      <SEO
        title="Essays | Decision tools for AI systems designers"
        description="A small, curated shelf of frameworks, architecture maps, and principles for people who design production AI systems. Not a content firehose."
        canonicalUrl="https://www.adityaai.dev/articles"
        breadcrumbs={[
          { name: 'Home', url: 'https://www.adityaai.dev/' },
          { name: 'Essays', url: 'https://www.adityaai.dev/articles' },
        ]}
      />
      <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-20">
        <div className="mb-12 border-b border-zinc-800/50 pb-8">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime mb-4">
            Essays · curated shelf
          </p>
          <h1 className="font-display font-semibold text-[clamp(2.5rem,8vw,4rem)] leading-[1.1] tracking-[-0.02em] text-zinc-50 mb-4">
            Decision tools for systems designers
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed mb-3">
            A short shelf - not a stream. Each piece is meant to change how you
            architect agents, memory, cost, or the product surface.
          </p>
          <p className="text-zinc-600 text-sm font-mono mb-8">
            {articles.length} essays · restart {new Date().getFullYear()}
          </p>

          <div className="flex flex-wrap gap-3">
            {FORMS.map((form) => (
              <button
                key={form}
                type="button"
                onClick={() => setFilter(form)}
                className={`px-5 py-2 rounded-full border text-xs uppercase tracking-widest font-mono transition-all duration-300 ${
                  filter === form
                    ? 'bg-electric-lime text-zinc-950 border-electric-lime'
                    : 'bg-transparent text-zinc-400 hover:text-zinc-50 hover:border-zinc-500 border-zinc-800'
                }`}
              >
                {form}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
          <div className="flex flex-col gap-6 md:gap-8">
            {filteredArticles.map((article, i) =>
              i % 2 === 0 ? (
                <ArticleCard key={article.slug} article={article} index={i} />
              ) : null,
            )}
          </div>
          <div className="flex flex-col gap-6 md:gap-8 md:mt-16">
            {filteredArticles.map((article, i) =>
              i % 2 !== 0 ? (
                <ArticleCard key={article.slug} article={article} index={i} />
              ) : null,
            )}
          </div>
        </div>
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
        className="block group relative p-6 md:p-8 border-t border-zinc-800 hover:border-electric-lime hover:bg-zinc-900/20 active:bg-zinc-900/30 transition-colors duration-500"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-widest text-electric-lime">
              {article.form}
            </span>
            {article.featured && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                Start here
              </span>
            )}
            <span className="text-zinc-800">·</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {article.readingTime} min
            </span>
          </div>
          <ArrowUpRight
            size={16}
            className="text-zinc-700 group-hover:text-electric-lime transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </div>
        <h2 className="font-display font-medium text-xl md:text-2xl text-zinc-100 leading-snug group-hover:text-white transition-colors mb-3">
          {article.title}
        </h2>
        <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3 font-light">
          {article.excerpt}
        </p>
        <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
          {article.date}
        </div>
      </Link>
    </div>
  );
}
