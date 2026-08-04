import { useParams, Link } from 'react-router-dom';
import { useEffect, useMemo, useState, memo } from 'react';
import { m } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getArticleMeta, loadArticle, type Article } from '../lib/articles';
import SEO from '../components/SEO';
import NewsletterPrompt from '../components/NewsletterPrompt';
import RelatedArticles from '../components/RelatedArticles';
import FixedBackButton from '../components/FixedBackButton';
import ArticleFeedback from '../components/ArticleFeedback';

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
          <div className="overflow-x-auto w-full my-8 rounded-lg border border-zinc-800/50">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap" {...props} />
          </div>
        ),
        thead: ({ node, ...props }) => <thead className="bg-zinc-900/50" {...props} />,
        th: ({ node, ...props }) => (
          <th className="border-b border-zinc-800/50 py-3 px-4 text-zinc-300 font-semibold" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="border-b border-zinc-800/50 py-3 px-4 text-zinc-400" {...props} />
        ),
        tr: ({ node, ...props }) => <tr className="last:border-0" {...props} />,
      }}
    >
      {content}
    </Markdown>
  );
});

export default function ArticleDetail() {
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

  // ISO date at noon UTC — stable datePublished without timezone day-shift.
  const publishDate = meta ? `${meta.dateISO}T12:00:00.000Z` : '';

  if (!meta) {
    return (
      <div className="min-h-screen pt-40 pb-16 flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-display font-semibold text-4xl text-zinc-50 mb-4">Essay Not Found</h1>
        <p className="text-zinc-400 mb-8">This essay isn't on the shelf — the library was restarted with a smaller curated set.</p>
        <Link to="/articles" className="text-electric-lime hover:underline">
          Back to Essays
        </Link>
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
    <div className="min-h-screen pt-32 pb-16">
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
          <Link
            to="/articles"
            className="inline-flex items-center gap-2 py-2 text-zinc-600 hover:text-zinc-400 transition-colors mb-12 font-mono text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={14} />
            Back
          </Link>

          <header className="mb-16">
            <div className="flex items-center gap-3 font-mono text-sm uppercase tracking-wider mb-6 flex-wrap">
              <span className="text-electric-lime">{meta.form}</span>
              {meta.featured && (
                <>
                  <span className="text-zinc-700">•</span>
                  <span className="text-zinc-500">Start here</span>
                </>
              )}
              <span className="text-zinc-700">•</span>
              <span className="text-zinc-500">{meta.date}</span>
              <span className="text-zinc-700">•</span>
              <span className="text-zinc-500">{meta.readingTime} min read</span>
            </div>
            <h1 className="font-display font-semibold text-[clamp(2rem,5vw,3.5rem)] leading-[1.1] tracking-[-0.02em] text-zinc-50 mb-6">
              {meta.title}
            </h1>
          </header>

          <div className="article-body prose prose-invert prose-zinc max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-electric-lime hover:prose-a:text-electric-lime/80 prose-p:leading-[1.7] prose-p:text-zinc-300">
            {loadState === 'loading' && !article && (
              <p className="text-zinc-500 font-mono text-sm">Loading article…</p>
            )}
            {loadState === 'error' && (
              <p className="text-red-400 text-sm">Failed to load article content. Please refresh.</p>
            )}
            {article && <ArticleMarkdown content={contentWithoutTitle} />}
          </div>

          <div className="mt-20 pt-10 border-t border-zinc-800/50 flex flex-col sm:flex-row gap-6 justify-between items-start sm:items-center">
            <div className="flex items-center gap-4">
              <img
                src="https://res.cloudinary.com/dpdttqyow/image/upload/f_auto,q_auto,w_100/v1768512786/Screenshot_2026-01-198_v3bwry.png"
                alt="Aditya Gaurav"
                className="size-12 object-contain"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                width={48}
                height={48}
              />
              <div>
                <div className="font-medium text-zinc-100">Aditya Gaurav</div>
                <div className="text-sm text-zinc-500">AI Researcher & Systems Architect</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleShare}
              className="w-full sm:w-auto border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 rounded-full px-6 py-3 sm:py-2 text-xs uppercase tracking-widest font-mono transition-colors active:scale-[0.98]"
            >
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
