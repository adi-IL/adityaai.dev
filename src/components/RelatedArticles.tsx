import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { articles, type ArticleMeta } from '../lib/articles';

/**
 * Related essays for a small curated shelf:
 *   1. Same form (Framework / Architecture / Principle)
 *   2. Shared topics
 *   3. Fill with remaining shelf (never empty for 12 essays)
 */
function pickRelated(currentSlug: string): ArticleMeta[] {
  const current = articles.find((a) => a.slug === currentSlug);
  if (!current) return [];

  const others = articles.filter((a) => a.slug !== currentSlug);
  const scored = others.map((a) => {
    let score = 0;
    if (a.form === current.form) score += 3;
    const shared = a.topics.filter((t) => current.topics.includes(t)).length;
    score += shared * 2;
    if (a.featured) score += 1;
    return { a, score };
  });

  scored.sort((x, y) => y.score - x.score || y.a.dateISO.localeCompare(x.a.dateISO));
  return scored.slice(0, 3).map((s) => s.a);
}

export default function RelatedArticles({ currentSlug }: { currentSlug: string }) {
  const related = pickRelated(currentSlug);
  if (related.length === 0) return null;

  return (
    <section
      aria-labelledby="related-articles-heading"
      className="mt-20 pt-12 border-t border-zinc-800/60"
    >
      <div className="flex items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
          <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
          <h2 id="related-articles-heading">Continue on the shelf</h2>
        </div>
        <Link
          to="/articles"
          className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 hover:text-electric-lime transition-colors inline-flex items-center gap-1"
        >
          All essays <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {related.map((article, i) => (
          <m.div
            key={article.slug}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
          >
            <Link
              to={`/articles/${article.slug}`}
              className="group relative flex flex-col justify-between h-full rounded-2xl border border-zinc-800/70 hover:border-electric-lime/50 transition-all duration-300 p-5 bg-[#0a0a0a]"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-electric-lime">
                    {article.form}
                  </span>
                  <ArrowUpRight
                    size={14}
                    className="text-zinc-600 group-hover:text-electric-lime transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>
                <h3 className="font-display font-semibold text-base text-zinc-100 leading-snug group-hover:text-white transition-colors line-clamp-3 mb-4">
                  {article.title}
                </h3>
              </div>
              <div className="border-t border-zinc-900 pt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest tabular-nums text-zinc-500">
                <span>{article.readingTime} min read</span>
                <span>{article.date}</span>
              </div>
            </Link>
          </m.div>
        ))}
      </div>
    </section>
  );
}
