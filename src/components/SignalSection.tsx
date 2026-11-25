import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const label = 'font-mono text-[10px] uppercase tracking-[0.22em]';

/** Pull-quotes only from the curated shelf. */
const signalQuotes = [
  {
    quote: 'The product is the model.',
    slug: 'product-is-the-model',
    form: 'Principle',
  },
  {
    quote: 'Memory is the layer below reasoning.',
    slug: 'memory-stacks-for-agents',
    form: 'Framework',
  },
  {
    quote: 'Token cost is the wrong metric for agents.',
    slug: 'inference-economics-for-agents',
    form: 'Framework',
  },
  {
    quote: 'Architect for Software 3.0, not chat wrappers.',
    slug: 'software-3-architecting-ai',
    form: 'Architecture',
  },
  {
    quote: 'MCP connects everything - and exposes everything.',
    slug: 'mcp-security-paradox',
    form: 'Framework',
  },
  {
    quote: 'The model proposes. Deterministic arbiters dispose.',
    slug: 'the-verification-gap',
    form: 'Principle',
  },
  {
    quote: 'Passing a unit test does not prove a patch is correct.',
    slug: 'closed-loop-remediation-architecture',
    form: 'Framework',
  },
  {
    quote: 'Multi-agent systems cannot run on static prompts.',
    slug: 'the-chat-template-trap',
    form: 'Architecture',
  },
];

export default function SignalSection() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = window.setTimeout(() => setIdx((i) => (i + 1) % signalQuotes.length), 6000);
    return () => window.clearTimeout(t);
  }, [idx]);
  const current = signalQuotes[idx];
  if (!current) return null;

  return (
    <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-16">
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] p-8 md:p-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent"
        />

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-zinc-900 pb-4">
          <div className={`${label} flex items-center gap-2.5 text-electric-lime`}>
            <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)] motion-safe:animate-pulse" />
            Signal · shelf axioms
          </div>
          <div role="group" aria-label="Select signal quote" className="flex flex-wrap items-center">
            {signalQuotes.map((q, i) => {
              const active = i === idx;
              return (
                <button
                  key={q.slug}
                  type="button"
                  aria-pressed={active}
                  aria-label={`Quote ${i + 1}: ${q.quote}`}
                  onClick={() => setIdx(i)}
                  className="group flex min-w-7 justify-center py-3 px-1.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime rounded"
                >
                  <span
                    aria-hidden
                    className={`block h-1.5 rounded-full transition-all duration-300 ${
                      active ? 'w-6 bg-electric-lime' : 'w-2 bg-zinc-800 group-hover:bg-zinc-500'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <m.div
            key={current.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="min-h-[120px] flex flex-col justify-between gap-6"
          >
            <blockquote className="font-display text-[clamp(1.5rem,3.8vw,2.5rem)] font-medium leading-[1.2] tracking-[-0.02em] text-zinc-100">
              “{current.quote}”
            </blockquote>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-electric-lime">
                  {current.form}
                </span>
                <span className="tabular-nums">
                  {String(idx + 1).padStart(2, '0')} / {String(signalQuotes.length).padStart(2, '0')}
                </span>
              </div>
              <Link
                to={`/articles/${current.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-zinc-300 hover:border-electric-lime hover:text-electric-lime transition-colors font-mono text-[10px] uppercase tracking-widest"
              >
                Read the essay
                <ArrowUpRight size={13} />
              </Link>
            </div>
          </m.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
