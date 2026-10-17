import { useParams, Link } from 'react-router-dom';
import { useEffect, useMemo, useState, memo } from 'react';
import { m, useScroll } from 'motion/react';
import { ArrowLeft, Check, Share2 } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getArticleMeta, loadArticle, type Article } from '../lib/articles';
import SEO from '../components/SEO';
import NewsletterPrompt from '../components/NewsletterPrompt';
import RelatedArticles from '../components/RelatedArticles';
import FixedBackButton from '../components/FixedBackButton';
import ArticleFeedback from '../components/ArticleFeedback';

const label = 'font-mono text-[10px] uppercase tracking-[0.22em]';

/**
 * Isolated markdown body so it stays perfectly stable across any re-render
 * of the parent page (e.g. the share button toggling state). Without this,
 * react-markdown re-parses the entire ~300-line article on every parent
 * setState, which is the main-thread stall that shows up as a "scroll got
 * stuck" moment mid-article.
 */
const ArticleMarkdown = memo(function ArticleMarkdown({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ node, ...props }) => (
          <div className="my-8 w-full overflow-x-auto rounded-2xl border border-zinc-800/80 bg-[#0a0a0a]">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => <thead className="border-b border-zinc-800 bg-zinc-900/60 font-mono text-xs uppercase tracking-wider" {...props} />,
        th: ({ node, ...props }) => (
          <th className="border-b border-zinc-800/70 px-4 py-3 font-semibold text-zinc-200" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="border-b border-zinc-900 px-4 py-3 text-zinc-300 tabular-nums" {...props} />
        ),
        tr: ({ node, ...props }) => <tr className="last:border-0 hover:bg-zinc-900/30" {...props} />,
      }}
    >
      {content}
    </Markdown>
  );
});

export default function ArticleDetail() {
  const { scrollYProgress } = useScroll();
  const { slug } = useParams();
  const meta = slug ? getArticleMeta(slug) : undefined;
  const [article, setArticle] = useState<Article | null>(null);
  const [loadState, setLoadState] = useState<'idle' | 'loading' | 'error'>('idle');
  const [isShared, setIsShared] = useState(false);

  useEffect(() => {
    if (!slug || !meta) {
      setArticle(null);
      setLoadState('idle');
      return;
    }

    let cancelled = false;
    setLoadState('loading');
    setArticle(null);

    void loadArticle(slug).then((loaded) => {
      if (cancelled) return;
      if (!loaded) {
        setLoadState('error');
        setArticle(null);
        return;
      }
      setArticle(loaded);
      setLoadState('idle');
    });

    return () => {
      cancelled = true;
    };
  }, [slug, meta]);

  const contentWithoutTitle = useMemo(
    () => (article ? article.content.replace(/^#\s+(.*)\r?\n/, '') : ''),
    [article],
  );

  // ISO date at noon UTC - stable datePublished without timezone day-shift.
  const publishDate = meta ? `${meta.dateISO}T12:00:00.000Z` : '';

  if (!meta) {
    return (
      <div className="min-h-screen pt-40 pb-16 flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-lg rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] p-10 md:p-12">
          <p className={`${label} mb-3 text-electric-lime`}>404 · Shelf lookup</p>
          <h1 className="font-display font-semibold text-3xl md:text-4xl text-zinc-50 mb-4">Essay Not Found</h1>
          <p className="text-zinc-400 mb-8 text-sm md:text-base leading-relaxed">
            This essay isn't on the shelf - the library was restarted with a smaller curated set.
          </p>
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 rounded-full border border-electric-lime bg-electric-lime/10 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-electric-lime transition-colors hover:bg-electric-lime hover:text-zinc-950"
          >
            <ArrowLeft size={14} />
            Back to Essays
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const shareData = {
      title: meta.title,
      text: `Check out this article: ${meta.title}`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setIsShared(true);
        setTimeout(() => setIsShared(false), 2000);
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-24">
      <m.div
        className="fixed top-0 left-0 right-0 h-1 bg-electric-lime transform-gpu z-50 origin-left shadow-[0_0_12px_rgba(202,255,74,0.8)]"
        style={{ scaleX: scrollYProgress }}
      />
      <SEO
        title={`${meta.title} | Aditya Gaurav`}
        description={meta.excerpt}
        canonicalUrl={`https://www.adityaai.dev/articles/${meta.slug}`}
        ogType="article"
        publishDate={publishDate}
        articleType={meta.form === 'Framework' || meta.form === 'Architecture' ? 'ScholarlyArticle' : 'Article'}
        readingTimeMinutes={meta.readingTime}
        wordCount={meta.wordCount}
        breadcrumbs={[
          { name: 'Home', url: 'https://www.adityaai.dev/' },
          { name: 'Essays', url: 'https://www.adityaai.dev/articles' },
          { name: meta.title, url: `https://www.adityaai.dev/articles/${meta.slug}` },
        ]}
      />

      <FixedBackButton to="/articles" />

      <article className="max-w-3xl mx-auto px-6 md:px-8 py-12">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="mb-10 flex items-center justify-between gap-4">
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#0a0a0a] px-4 py-1.5 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100 transition-colors font-mono text-[10px] uppercase tracking-widest"
            >
              <ArrowLeft size={13} />
              Back to shelf
            </Link>

            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-[#0a0a0a] px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:border-electric-lime hover:text-electric-lime"
            >
              {isShared ? <Check size={12} className="text-electric-lime" /> : <Share2 size={12} />}
              {isShared ? 'Link Copied' : 'Share'}
            </button>
          </div>

          <header className="mb-14 border-b border-zinc-800/60 pb-10">
            <div className="mb-5 flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-[#0a0a0a] px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-electric-lime">
                <span aria-hidden className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)]" />
                {meta.form}
              </span>
              {meta.featured && (
                <span className="rounded-md border border-electric-lime/30 bg-electric-lime/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-electric-lime">
                  Start here
                </span>
              )}
            </div>

            <h1 className="font-display font-semibold text-[clamp(2rem,5vw,3.5rem)] leading-[1.08] tracking-[-0.02em] text-zinc-50 mb-5">
              {meta.title}
            </h1>

            <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8 font-light">
              {meta.excerpt}
            </p>

            {/* Reading Telemetry Strip */}
            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-800/60">
              <div className="bg-[#0a0a0a] p-4">
                <dt className={`${label} text-zinc-500`}>Published</dt>
                <dd className="mt-1.5 font-mono text-xs md:text-sm font-semibold tabular-nums text-zinc-200">
                  {meta.date}
                </dd>
              </div>
              <div className="bg-[#0a0a0a] p-4">
                <dt className={`${label} text-zinc-500`}>Reading time</dt>
                <dd className="mt-1.5 font-mono text-xs md:text-sm font-semibold tabular-nums text-electric-lime">
                  {meta.readingTime} min read
                </dd>
              </div>
              <div className="bg-[#0a0a0a] p-4">
                <dt className={`${label} text-zinc-500`}>Length</dt>
                <dd className="mt-1.5 font-mono text-xs md:text-sm font-semibold tabular-nums text-zinc-200">
                  {meta.wordCount.toLocaleString()} words
                </dd>
              </div>
            </dl>

            {meta.topics.length > 0 && (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className={`${label} mr-1 text-zinc-500`}>Topics</span>
                {meta.topics.map((topic) => (
                  <span
                    key={topic}
                    className="rounded-full border border-zinc-800/80 bg-[#0a0a0a] px-3 py-1 font-mono text-[10px] text-zinc-300"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="article-body prose prose-invert prose-zinc max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-electric-lime hover:prose-a:text-electric-lime/80 prose-p:leading-[1.75] prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-zinc-100 prose-code:text-electric-lime prose-code:bg-zinc-900/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-zinc-800/80 prose-pre:rounded-2xl">
            {loadState === 'loading' && !article && (
              <p className="text-zinc-500 font-mono text-sm">Loading article…</p>
            )}
            {loadState === 'error' && (
              <p className="text-red-400 text-sm">Failed to load article content. Please refresh.</p>
            )}
            {article && <ArticleMarkdown content={contentWithoutTitle} />}
          </div>

          <div className="mt-20 rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] p-6 md:p-8 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
            <div className="flex items-center gap-4">
              <img
                src="https://res.cloudinary.com/dpdttqyow/image/upload/f_auto,q_auto,w_100/v1768512786/Screenshot_2026-01-198_v3bwry.png"
                alt="Aditya Gaurav"
                className="size-12 object-contain rounded-xl border border-zinc-800/80 bg-zinc-950 p-1"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                width={48}
                height={48}
              />
              <div>
                <div className="font-display font-semibold text-base text-zinc-100">Aditya Gaurav</div>
                <div className="font-mono text-xs text-zinc-400">AI Researcher · Systems Architect</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-electric-lime hover:text-electric-lime rounded-full px-6 py-2.5 text-xs uppercase tracking-widest font-mono transition-colors active:scale-[0.98]"
            >
              {isShared ? <Check size={14} className="text-electric-lime" /> : <Share2 size={14} />}
              {isShared ? 'Link Copied!' : 'Share Essay'}
            </button>
          </div>

          <ArticleFeedback slug={meta.slug} title={meta.title} />

          <NewsletterPrompt
            headline="Want the next decision tool in your inbox?"
            subhead="Infrequent essays for people who design AI systems. No spam, confirm to join, unsubscribe any time."
          />

          <RelatedArticles currentSlug={meta.slug} />
        </m.div>
      </article>
    </div>
  );
}
