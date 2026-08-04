import { useEffect, useState, type FormEvent } from 'react';
import { m } from 'motion/react';
import { CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { articles, featuredArticles, type ArticleMeta } from '../lib/articles';
import { projects } from '../lib/projects';
import SEO from '../components/SEO';
import Magnetic from '../components/Magnetic';
import TypewriterText from '../components/TypewriterText';
import SignalSection from '../components/SignalSection';
import HomeProjectCard from '../components/HomeProjectCard';

export default function Home() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmBanner, setConfirmBanner] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    const flag = searchParams.get('subscribed');
    if (!flag) return;
    if (flag === '1') {
      setConfirmBanner("You're confirmed. Welcome to the list.");
    } else if (flag === 'expired') {
      setConfirmBanner('That confirmation link expired. Submit your email again to get a new one.');
    } else {
      setConfirmBanner('That confirmation link is invalid. Submit your email again to get a new one.');
    }
    const next = new URLSearchParams(searchParams);
    next.delete('subscribed');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSubscribe = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    try {
      const form = e.currentTarget;
      const website = (form.elements.namedItem('website') as HTMLInputElement | null)?.value || '';
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website }),
      });

      const data = await response.json().catch(() => ({} as { error?: string }));

      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(
          typeof data.error === 'string' ? data.error : 'Something went wrong. Please try again.',
        );
      }
    } catch {
      setStatus('error');
      setErrorMessage('Failed to connect to the server. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-16 relative">
      <div className="relative z-10">
        <SEO
          title="Aditya Gaurav - AI Engineer · Systems Architect"
          description={`AI Engineer & Systems Architect. Decision tools for people who design production AI systems — ${articles.length} curated essays on architecture, agents, and the product surface.`}
        />

        {confirmBanner && (
          <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
            <div
              role="status"
              className="mb-6 rounded-xl border border-electric-lime/30 bg-electric-lime/10 px-4 py-3 text-sm text-electric-lime flex items-start justify-between gap-4"
            >
              <span className="flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                {confirmBanner}
              </span>
              <button
                type="button"
                onClick={() => setConfirmBanner(null)}
                className="text-zinc-400 hover:text-zinc-200 text-xs font-mono uppercase tracking-widest shrink-0"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-20 md:py-32">
          <div className="grid grid-cols-1 md:grid-cols-[60%_1fr] gap-12 md:gap-20 items-center">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            >
              <TypewriterText text="welcome to adityaai.dev" delay={500} />
              <h1 className="font-display font-semibold text-[clamp(1.75rem,4.25vw,3rem)] leading-[1.15] tracking-[-0.03em] text-zinc-50">
                AI Researcher <span className="text-zinc-500">·</span> Systems Architect
              </h1>
              <p className="text-zinc-400 text-xl md:text-2xl font-light leading-relaxed max-w-2xl mt-6">
                Building the layer between research and production.
              </p>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
              className="flex flex-col items-center md:items-start gap-6 md:ml-12"
            >
              <img
                src="https://res.cloudinary.com/dpdttqyow/image/upload/f_auto,q_auto,w_400/v1768512786/Screenshot_2026-01-198_v3bwry.png"
                alt="Aditya Gaurav"
                className="w-48 md:w-64 h-auto object-contain"
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                width={400}
                height={400}
              />

              <Link
                to="/articles"
                className="flex items-center justify-center gap-2 py-2 text-zinc-400 hover:text-electric-lime font-mono text-xs uppercase tracking-widest transition-colors active:scale-[0.98] w-48 md:w-64"
              >
                Start with the essays <ArrowUpRight size={14} />
              </Link>
            </m.div>
          </div>
        </section>

        {/* Manifesto Section */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-32 md:py-48">
          <m.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
            className="max-w-4xl"
          >
            <h2 className="font-display font-medium text-[clamp(2rem,5vw,4rem)] leading-[1.1] tracking-[-0.02em] text-zinc-100 mb-8">
              Intelligence is not just scaled; it is architected. We are moving from stochastic parrots to <span className="text-zinc-500">reasoning engines</span>.
            </h2>
            <p className="text-zinc-400 text-xl md:text-2xl font-light leading-relaxed max-w-2xl">
              My research focuses on bridging the gap between theoretical cognitive models and production-ready, scalable AI systems.
            </p>
          </m.div>
        </section>

        {/* Signal Section (rotating pull-quote from real articles) */}
        <SignalSection />

        {/* Terminal Section */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-24 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full pointer-events-none" />

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="rounded-xl overflow-hidden border border-zinc-800 bg-[#0a0a0a] shadow-2xl relative z-10 max-w-3xl mx-auto"
          >
            <div className="flex items-center px-4 py-3 border-b border-zinc-800 bg-[#111]">
              <div className="flex gap-2">
                <div className="size-3 rounded-full bg-zinc-700" />
                <div className="size-3 rounded-full bg-zinc-700" />
                <div className="size-3 rounded-full bg-zinc-700" />
              </div>
              <div className="mx-auto text-xs font-mono text-zinc-500">sentinel · agents.ts</div>
            </div>
            <div className="p-6 md:p-8 overflow-x-auto">
              <pre className="font-mono text-[13px] md:text-[15px] leading-[1.85]">
                <code className="text-zinc-300">
                  <span className="text-zinc-500">{"// 5-agent chain - 47s end-to-end - scored SWOT out"}</span><br/>
                  <br/>
                  <span className="text-pink-500">const</span> {'{ intent  }'}  = <span className="text-pink-500">await</span> <span className="text-blue-400">router</span>(query);<br/>
                  <span className="text-pink-500">const</span> {'{ urls    }'}  = <span className="text-pink-500">await</span> <span className="text-blue-400">hunter</span>(intent.target);<br/>
                  <span className="text-pink-500">const</span> {'{ sheet   }'}  = <span className="text-pink-500">await</span> <span className="text-blue-400">scraper</span>(urls);<br/>
                  <span className="text-pink-500">const</span> {'{ swot    }'}  = <span className="text-pink-500">await</span> <span className="text-blue-400">analyst</span>(sheet);  <span className="text-zinc-500">{"// Gemini Pro"}</span><br/>
                  <span className="text-pink-500">const</span> {'{ report  }'}  = <span className="text-pink-500">await</span> <span className="text-blue-400">reporter</span>(swot);<br/>
                  <br/>
                  <span className="text-pink-500">return</span> report;  <span className="text-zinc-500">{"// 5 dimensions scored 0-100"}</span>
                </code>
              </pre>
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-center"
          >
            <Link
              to="/projects/sentinel"
              className="inline-flex items-center gap-2 text-zinc-500 hover:text-electric-lime transition-colors font-mono text-xs uppercase tracking-widest"
            >
              Real code from Sentinel
              <ArrowUpRight size={14} />
            </Link>
          </m.div>
        </section>

        {/* Marquee Section */}
        <section className="py-20 overflow-hidden border-y border-zinc-900 bg-[#050505]">
          <div className="flex whitespace-nowrap">
            <m.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 20 }}
              className="flex gap-16 px-8 font-display text-4xl md:text-6xl font-bold text-zinc-800 uppercase tracking-widest gpu"
            >
              <span className="hover:text-zinc-600 transition-colors cursor-default">Neural Networks</span>
              <span>•</span>
              <span className="hover:text-zinc-600 transition-colors cursor-default">Agentic Systems</span>
              <span>•</span>
              <span className="hover:text-zinc-600 transition-colors cursor-default">Cognitive Architectures</span>
              <span>•</span>
              <span className="hover:text-zinc-600 transition-colors cursor-default">Scalable Inference</span>
              <span>•</span>
              <span className="hover:text-zinc-600 transition-colors cursor-default">Reinforcement Learning</span>
              <span>•</span>
              <span className="hover:text-zinc-600 transition-colors cursor-default">Neural Networks</span>
              <span>•</span>
              <span className="hover:text-zinc-600 transition-colors cursor-default">Agentic Systems</span>
              <span>•</span>
              <span className="hover:text-zinc-600 transition-colors cursor-default">Cognitive Architectures</span>
              <span>•</span>
              <span className="hover:text-zinc-600 transition-colors cursor-default">Scalable Inference</span>
              <span>•</span>
              <span className="hover:text-zinc-600 transition-colors cursor-default">Reinforcement Learning</span>
              <span>•</span>
            </m.div>
          </div>
        </section>

        {/* Articles Section */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-32 cv-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="mb-12 flex items-baseline justify-between border-b border-zinc-800/50 pb-6"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime mb-2">
                Start here
              </p>
              <h2 className="font-display font-semibold text-[clamp(1.75rem,4vw,2.5rem)] text-zinc-50">
                Decision tools
              </h2>
            </div>
            <Link to="/articles" className="text-zinc-500 hover:text-electric-lime transition-colors text-xs font-mono uppercase tracking-widest flex items-center gap-1 py-2">
              Full shelf ({articles.length}) <ArrowUpRight size={14} />
            </Link>
          </m.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <div className="flex flex-col gap-6 md:gap-8">
              {(featuredArticles.length ? featuredArticles : articles).slice(0, 4).map((article, i) =>
                i % 2 === 0 ? (
                  <ArticleCard key={article.slug} article={article} index={i} />
                ) : null
              )}
            </div>

            <div className="flex flex-col gap-6 md:gap-8 md:mt-16">
              {(featuredArticles.length ? featuredArticles : articles).slice(0, 4).map((article, i) =>
                i % 2 !== 0 ? (
                  <ArticleCard key={article.slug} article={article} index={i} />
                ) : null
              )}
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-32 cv-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="mb-12 flex items-baseline justify-between border-b border-zinc-800/50 pb-6"
          >
            <h2 className="font-display font-semibold text-[clamp(1.75rem,4vw,2.5rem)] text-zinc-50">
              Projects
            </h2>
            <Link to="/projects" className="text-zinc-500 hover:text-electric-lime transition-colors text-xs font-mono uppercase tracking-widest flex items-center gap-1 py-2">
              View all <ArrowUpRight size={14} />
            </Link>
          </m.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <HomeProjectCard key={project.slug} project={project} index={i} />
            ))}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="max-w-2xl mx-auto px-6 md:px-8 py-20 cv-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="border-t border-zinc-800/50 pt-16 text-center"
          >
            <h2 className="font-display font-medium text-2xl text-zinc-100 mb-4">Join the Newsletter</h2>
            <p className="text-zinc-500 font-light mb-8">Decision tools for systems designers. Infrequent — confirm your email to join.</p>

            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto relative" onSubmit={handleSubscribe}>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
                defaultValue=""
              />
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === 'loading' || status === 'success'}
                placeholder="you@example.com"
                className="flex-1 bg-transparent border-b border-zinc-800 px-4 py-3 text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 font-light placeholder:text-zinc-700"
                required
              />
              <Magnetic>
                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="border border-zinc-800 rounded-full px-6 py-3 text-zinc-400 hover:text-electric-lime hover:border-electric-lime font-mono text-xs uppercase tracking-widest transition-colors active:scale-[0.98] disabled:opacity-50 disabled:hover:text-zinc-400 disabled:hover:border-zinc-800 min-w-[120px] flex items-center justify-center"
                >
                  {status === 'loading' ? (
                    <div className="size-4 border border-zinc-700 border-t-electric-lime rounded-full animate-spin" />
                  ) : status === 'success' ? (
                    'Subscribed'
                  ) : (
                    'Subscribe →'
                  )}
                </button>
              </Magnetic>
            </form>

            {status === 'success' && (
              <m.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-electric-lime mt-4 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <CheckCircle2 size={16} />
                Check your inbox and confirm the link to finish subscribing.
              </m.p>
            )}

            {status === 'error' && (
              <m.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 mt-4 flex items-center justify-center gap-2 text-sm font-medium"
              >
                <XCircle size={16} />
                {errorMessage}
              </m.p>
            )}
          </m.div>
        </section>
      </div>
    </div>
  );
}

function ArticleCard({ article, index }: { article: ArticleMeta; index: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.32, 0.72, 0, 1] }}
    >
      <Link
        to={`/articles/${article.slug}`}
        className="block group relative p-6 md:p-8 border-t border-zinc-800 hover:border-electric-lime transition-colors duration-500"
      >
        <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/20 group-active:bg-zinc-900/30 transition-colors duration-500 -z-10" />
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-[10px] uppercase tracking-widest text-electric-lime">
              {article.form}
            </span>
            <span className="text-zinc-800">•</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {article.date}
            </span>
            <span className="text-zinc-800">•</span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
              {article.readingTime} min read
            </span>
          </div>
          <ArrowUpRight size={18} className="text-zinc-700 group-hover:text-electric-lime transition-colors duration-300 transform group-hover:translate-x-1 group-hover:-translate-y-1" />
        </div>
        <h3 className="font-display font-medium text-[clamp(1.25rem,2vw,1.5rem)] text-zinc-100 mb-3 leading-tight group-hover:text-white transition-colors">
          {article.title}
        </h3>
        <p className="text-zinc-500 text-sm leading-relaxed line-clamp-3 font-light">
          {article.excerpt}
        </p>
      </Link>
    </m.div>
  );
}
