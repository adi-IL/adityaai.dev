import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/** Pull-quotes only from the curated shelf. */
const signalQuotes = [
  {
    quote: 'The product is the model.',
    slug: 'product-is-the-model',
  },
  {
    quote: 'Memory is the layer below reasoning.',
    slug: 'memory-stacks-for-agents',
  },
  {
    quote: 'Token cost is the wrong metric for agents.',
    slug: 'inference-economics-for-agents',
  },
  {
    quote: 'Architect for Software 3.0, not chat wrappers.',
    slug: 'software-3-architecting-ai',
  },
  {
    quote: 'MCP connects everything - and exposes everything.',
    slug: 'mcp-security-paradox',
  },
  {
    quote: 'The model proposes. Deterministic arbiters dispose.',
    slug: 'the-verification-gap',
  },
  {
    quote: 'Passing a unit test does not prove a patch is correct.',
    slug: 'closed-loop-remediation-architecture',
  },
  {
    quote: 'Multi-agent systems cannot run on static prompts.',
    slug: 'the-chat-template-trap',
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
    <section className="max-w-4xl mx-auto px-6 md:px-8 py-32">
      <div className="flex items-center gap-3 mb-10 font-mono text-xs uppercase tracking-widest text-electric-lime">
        <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)] animate-pulse" />
        Signal
      </div>
      <AnimatePresence mode="wait">
        <m.div
          key={current.slug}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.45 }}
        >
          <blockquote className="font-display text-[clamp(1.5rem,4vw,2.25rem)] leading-[1.25] tracking-[-0.02em] text-zinc-100 mb-8">
            “{current.quote}”
          </blockquote>
          <Link
            to={`/articles/${current.slug}`}
            className="inline-flex items-center gap-2 text-zinc-500 hover:text-electric-lime transition-colors font-mono text-xs uppercase tracking-widest"
          >
            Read the essay
            <ArrowUpRight size={14} />
          </Link>
        </m.div>
      </AnimatePresence>
    </section>
  );
}
