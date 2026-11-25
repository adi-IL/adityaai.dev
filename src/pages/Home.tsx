import { useEffect, useState, useRef, type FormEvent } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { CheckCircle2, XCircle, ArrowUpRight } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { articles, featuredArticles, type ArticleMeta } from '../lib/articles';
import { projects } from '../lib/projects';
import { mergedPrs } from '../lib/upstreamLedger';
import SEO from '../components/SEO';
import Magnetic from '../components/Magnetic';
import TypewriterText from '../components/TypewriterText';
import SignalSection from '../components/SignalSection';
import HomeProjectCard from '../components/HomeProjectCard';

export default function Home() {
  const prefersReducedMotion = useReducedMotion();
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
          title="Aditya Gaurav - AI Researcher · Systems Architect"
          canonicalUrl="https://www.adityaai.dev/"
          description={`AI Researcher & Systems Architect. Decision tools for people who design production AI systems - ${articles.length} curated essays on architecture, agents, and the product surface.`}
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
        <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-16 md:py-24 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-[60%_1fr] gap-12 lg:gap-20 items-center">
            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            >
              <TypewriterText text="Aditya Gaurav" delay={200} />
              <h1 className="font-display font-semibold text-[clamp(1.75rem,4.25vw,3rem)] leading-[1.12] tracking-[-0.03em] text-zinc-50">
                AI Researcher <span className="text-zinc-500">·</span>
                <br />
                Systems Architect
              </h1>
              <p className="text-zinc-400 text-lg md:text-xl font-light leading-relaxed max-w-xl mt-5">
                I build agent harnesses, inference infrastructure, and production AI systems.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/projects"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-electric-lime px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-zinc-950 transition-colors hover:bg-electric-lime/90 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime"
                >
                  Inspect shipped systems <ArrowUpRight size={14} />
                </Link>
                <Link
                  to="/articles"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-zinc-800 bg-[#0a0a0a] px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-zinc-300 transition-colors hover:border-electric-lime hover:text-electric-lime active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime"
                >
                  Read the essays <ArrowUpRight size={14} />
                </Link>
              </div>
              <p className="mt-5 flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs text-zinc-400">
                <Link
                  to="/articles"
                  className="py-1 hover:text-electric-lime transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime rounded"
                >
                  <span className="text-zinc-200 tabular-nums">{articles.length}</span> essays
                </Link>
                <span aria-hidden className="text-zinc-600">·</span>
                <Link
                  to="/projects"
                  className="py-1 hover:text-electric-lime transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime rounded"
                >
                  <span className="text-zinc-200 tabular-nums">{projects.length}</span> systems
                </Link>
                <span aria-hidden className="text-zinc-600">·</span>
                <Link
                  to="/upstream"
                  className="py-1 hover:text-electric-lime transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime rounded"
                >
                  <span className="text-electric-lime tabular-nums">{mergedPrs.length}</span> upstream fixes
                </Link>
                <span aria-hidden className="text-zinc-600">·</span>
                <Link
                  to="/about"
                  className="py-1 text-amber-300/90 hover:text-amber-300 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime rounded"
                >
                  DeepMind × Kaggle Winner
                </Link>
              </p>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
              className="flex flex-col items-center lg:items-end"
            >
              <img
                src="https://res.cloudinary.com/dpdttqyow/image/upload/f_auto,q_auto,w_400/v1768512786/Screenshot_2026-01-198_v3bwry.png"
                alt="Aditya Gaurav"
                className="w-40 sm:w-48 lg:w-64 h-auto object-contain"
                referrerPolicy="no-referrer"
                loading="eager"
                decoding="async"
                fetchPriority="high"
                width={400}
                height={296}
              />
            </m.div>
          </div>
        </section>

        {/* Manifesto Section */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-24 md:py-36">
          <m.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.32, 0.72, 0, 1] }}
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime mb-5 flex items-center gap-2.5">
              <span aria-hidden className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)]" />
              Lab thesis · Software 3.0
            </p>
            <h2 className="font-display font-medium text-[clamp(2rem,5vw,4rem)] leading-[1.1] tracking-[-0.02em] text-zinc-100 mb-8 max-w-4xl">
              Intelligence is not just scaled; it is architected. We are moving from stochastic parrots to <span className="text-zinc-500">reasoning engines</span>.
            </h2>
            <p className="text-zinc-400 text-xl md:text-2xl font-light leading-relaxed max-w-2xl mb-12">
              My research focuses on bridging the gap between theoretical cognitive models and production-ready, scalable AI systems.
            </p>

            {/* 4-Tile Lab Telemetry Bar */}
            <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-800/60 lg:grid-cols-4">
              <div className="bg-[#0a0a0a]">
                <Link
                  to="/articles"
                  aria-label={`Decision tools: ${articles.length} curated systems essays`}
                  className="group block h-full p-5 md:p-6 transition-colors hover:bg-zinc-900/50"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400 flex items-center justify-between">
                    <span>Decision tools</span>
                    <ArrowUpRight size={12} className="text-zinc-600 group-hover:text-electric-lime transition-colors" />
                  </dt>
                  <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
                    {articles.length}
                  </dd>
                  <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
                    Curated systems essays
                  </p>
                </Link>
              </div>
              <div className="bg-[#0a0a0a]">
                <Link
                  to="/projects"
                  aria-label={`Production lab: ${projects.length} shipped systems (${projects.map((p) => p.name).join(', ')})`}
                  className="group block h-full p-5 md:p-6 transition-colors hover:bg-zinc-900/50"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400 flex items-center justify-between">
                    <span>Production lab</span>
                    <ArrowUpRight size={12} className="text-zinc-600 group-hover:text-electric-lime transition-colors" />
                  </dt>
                  <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
                    {projects.length}
                  </dd>
                  <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
                    {projects.map((p) => p.name).join(' · ')}
                  </p>
                </Link>
              </div>
              <div className="bg-[#0a0a0a]">
                <Link
                  to="/upstream"
                  aria-label={`Upstream ledger: ${mergedPrs.length} merged open-source fixes`}
                  className="group block h-full p-5 md:p-6 transition-colors hover:bg-zinc-900/50"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400 flex items-center justify-between">
                    <span>Upstream ledger</span>
                    <ArrowUpRight size={12} className="text-zinc-600 group-hover:text-electric-lime transition-colors" />
                  </dt>
                  <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-electric-lime md:text-5xl">
                    {mergedPrs.length}
                  </dd>
                  <p className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-400">
                    Merged open-source fixes
                  </p>
                </Link>
              </div>
              <div className="bg-[#0a0a0a]">
                <Link
                  to="/about"
                  aria-label="Global recognition: Winner, DeepMind × Kaggle Hackathon"
                  className="group block h-full p-5 md:p-6 transition-colors hover:bg-zinc-900/50"
                >
                  <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400 flex items-center justify-between">
                    <span>Global recognition</span>
                    <ArrowUpRight size={12} className="text-zinc-600 group-hover:text-electric-lime transition-colors" />
                  </dt>
                  <dd className="mt-2 font-sans text-3xl font-semibold tracking-tight text-amber-300 md:text-4xl">
                    Winner
                  </dd>
                  <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
                    DeepMind × Kaggle Hackathon
                  </p>
                </Link>
              </div>
            </dl>
          </m.div>
        </section>

        {/* Signal Section (rotating pull-quote from real articles) */}
        <SignalSection />

        {/* Lab Architecture Stack Section */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-20 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[50%] bg-zinc-800/20 blur-[120px] rounded-full pointer-events-none" />

          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="rounded-3xl overflow-hidden border border-zinc-800/80 bg-[#0a0a0a] shadow-2xl relative z-10"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent"
            />
            {/* Window chrome header */}
            <div className="flex items-center px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/80">
              <div className="flex gap-2">
                <div className="size-2.5 rounded-full bg-zinc-700/80" />
                <div className="size-2.5 rounded-full bg-zinc-700/80" />
                <div className="size-2.5 rounded-full bg-zinc-700/80" />
              </div>
              <div className="mx-auto text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-400 flex items-center gap-2">
                <span aria-hidden className="size-1.5 rounded-full bg-electric-lime" />
                systems architecture · production stack
              </div>
              <div className="text-[10px] font-mono uppercase tracking-widest text-electric-lime hidden sm:block">
                Software 3.0
              </div>
            </div>

            {/* Architecture stack body */}
            <div className="p-6 md:p-8 space-y-4">
              {/* Layer 3: Production Surfaces */}
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 md:p-6 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-electric-lime font-semibold">
                      Layer 3
                    </span>
                    <span className="font-mono text-xs uppercase tracking-wider text-zinc-200">
                      Autonomous Production Surfaces
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                    Multi-Modal · Live Workforces
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link
                    to="/projects/friday"
                    className="p-4 rounded-xl border border-zinc-800/70 bg-[#0a0a0a] hover:border-cyan-400/50 hover:bg-zinc-900/50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-display font-semibold text-base text-zinc-100 group-hover:text-cyan-300 transition-colors">
                        F.R.I.D.A.Y
                      </span>
                      <ArrowUpRight size={13} className="text-zinc-600 group-hover:text-cyan-300 transition-colors" />
                    </div>
                    <p className="text-xs text-zinc-400 font-light">
                      Generative 3D CAD engine · DeepMind winner
                    </p>
                  </Link>

                  <Link
                    to="/projects/sentinel"
                    className="p-4 rounded-xl border border-zinc-800/70 bg-[#0a0a0a] hover:border-blue-400/50 hover:bg-zinc-900/50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-display font-semibold text-base text-zinc-100 group-hover:text-blue-300 transition-colors">
                        Sentinel
                      </span>
                      <ArrowUpRight size={13} className="text-zinc-600 group-hover:text-blue-300 transition-colors" />
                    </div>
                    <p className="text-xs text-zinc-400 font-light">
                      Autonomous competitive intelligence FSM
                    </p>
                  </Link>

                  <Link
                    to="/projects/midsphere"
                    className="p-4 rounded-xl border border-zinc-800/70 bg-[#0a0a0a] hover:border-emerald-400/50 hover:bg-zinc-900/50 transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-display font-semibold text-base text-zinc-100 group-hover:text-emerald-300 transition-colors">
                        MidSphere
                      </span>
                      <ArrowUpRight size={13} className="text-zinc-600 group-hover:text-emerald-300 transition-colors" />
                    </div>
                    <p className="text-xs text-zinc-400 font-light">
                      Context circuit-breaker for DataHub
                    </p>
                  </Link>
                </div>
              </div>

              {/* Layer 2: Deterministic Harness & Arbiters */}
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 md:p-6 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-electric-lime font-semibold">
                      Layer 2
                    </span>
                    <span className="font-mono text-xs uppercase tracking-wider text-zinc-200">
                      Deterministic Harnesses & Arbiters
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                    Verification · Sandbox Isolation
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <Link
                    to="/articles/the-verification-gap"
                    className="p-4 rounded-xl border border-zinc-800/70 bg-[#0a0a0a] hover:border-electric-lime/50 transition-all group"
                  >
                    <div className="flex items-center justify-between text-zinc-100 group-hover:text-electric-lime mb-1.5">
                      <span>Deterministic Arbiters</span>
                      <ArrowUpRight size={12} className="text-zinc-600 group-hover:text-electric-lime" />
                    </div>
                    <span className="text-[11px] text-zinc-400 block">Compilers · Linters · Pytest · AST</span>
                  </Link>

                  <Link
                    to="/articles/context-circuit-breakers"
                    className="p-4 rounded-xl border border-zinc-800/70 bg-[#0a0a0a] hover:border-electric-lime/50 transition-all group"
                  >
                    <div className="flex items-center justify-between text-zinc-100 group-hover:text-electric-lime mb-1.5">
                      <span>Circuit Breakers</span>
                      <ArrowUpRight size={12} className="text-zinc-600 group-hover:text-electric-lime" />
                    </div>
                    <span className="text-[11px] text-zinc-400 block">Stagnation Gates · Output Quarantine</span>
                  </Link>

                  <Link
                    to="/articles/sandboxing-architectures-for-agents"
                    className="p-4 rounded-xl border border-zinc-800/70 bg-[#0a0a0a] hover:border-electric-lime/50 transition-all group"
                  >
                    <div className="flex items-center justify-between text-zinc-100 group-hover:text-electric-lime mb-1.5">
                      <span>Runtime Isolation</span>
                      <ArrowUpRight size={12} className="text-zinc-600 group-hover:text-electric-lime" />
                    </div>
                    <span className="text-[11px] text-zinc-400 block">Firecracker MicroVMs · gVisor · Proxies</span>
                  </Link>
                </div>
              </div>

              {/* Layer 1: Protocol & Inference Foundation */}
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 md:p-6 hover:border-zinc-700 transition-colors">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-electric-lime font-semibold">
                      Layer 1
                    </span>
                    <span className="font-mono text-xs uppercase tracking-wider text-zinc-200">
                      Inference, State & Protocol Foundation
                    </span>
                  </div>
                  <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                    Economics · Memory · MCP
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                  <Link
                    to="/articles/the-chat-template-trap"
                    className="p-4 rounded-xl border border-zinc-800/70 bg-[#0a0a0a] hover:border-electric-lime/50 transition-all group"
                  >
                    <div className="flex items-center justify-between text-zinc-100 group-hover:text-electric-lime mb-1.5">
                      <span>Provider Transforms</span>
                      <ArrowUpRight size={12} className="text-zinc-600 group-hover:text-electric-lime" />
                    </div>
                    <span className="text-[11px] text-zinc-400 block">Chat Templates · Prompt Cache Partition</span>
                  </Link>

                  <Link
                    to="/articles/memory-stacks-for-agents"
                    className="p-4 rounded-xl border border-zinc-800/70 bg-[#0a0a0a] hover:border-electric-lime/50 transition-all group"
                  >
                    <div className="flex items-center justify-between text-zinc-100 group-hover:text-electric-lime mb-1.5">
                      <span>Memory Stacks</span>
                      <ArrowUpRight size={12} className="text-zinc-600 group-hover:text-electric-lime" />
                    </div>
                    <span className="text-[11px] text-zinc-400 block">Episodic · Semantic · Procedural</span>
                  </Link>

                  <Link
                    to="/articles/inference-economics-for-agents"
                    className="p-4 rounded-xl border border-zinc-800/70 bg-[#0a0a0a] hover:border-electric-lime/50 transition-all group"
                  >
                    <div className="flex items-center justify-between text-zinc-100 group-hover:text-electric-lime mb-1.5">
                      <span>Inference Economics</span>
                      <ArrowUpRight size={12} className="text-zinc-600 group-hover:text-electric-lime" />
                    </div>
                    <span className="text-[11px] text-zinc-400 block">Token Multipliers · Retry Budgets</span>
                  </Link>
                </div>
              </div>
            </div>
          </m.div>

          <m.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-center"
          >
            <Link
              to="/articles"
              className="inline-flex items-center gap-2 text-zinc-400 hover:text-electric-lime transition-colors font-mono text-xs uppercase tracking-widest"
            >
              Explore the architectural frameworks
              <ArrowUpRight size={14} />
            </Link>
          </m.div>
        </section>

        {/* Marquee Section */}
        <section aria-hidden="true" className="py-16 overflow-hidden border-y border-zinc-900 bg-[#050505]">
          <div className="flex whitespace-nowrap">
            <m.div
              animate={prefersReducedMotion ? undefined : { x: ["0%", "-50%"] }}
              transition={prefersReducedMotion ? undefined : { repeat: Infinity, ease: "linear", duration: 20 }}
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
        <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-28 cv-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="mb-12 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/60 pb-6"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime mb-2 flex items-center gap-2">
                <span aria-hidden className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)]" />
                Start here · curated shelf
              </p>
              <h2 className="font-display font-semibold text-[clamp(1.75rem,4vw,2.5rem)] text-zinc-50">
                Decision tools
              </h2>
            </div>
            <Link
              to="/articles"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-[#0a0a0a] px-4 py-2 text-zinc-300 hover:border-electric-lime hover:text-electric-lime transition-colors text-[10px] font-mono uppercase tracking-widest"
            >
              Full shelf ({articles.length}) <ArrowUpRight size={13} />
            </Link>
          </m.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 items-start">
            <div className="flex flex-col gap-6 md:gap-8">
              {(featuredArticles.length ? featuredArticles : articles.slice(0, 4)).map((article, i) =>
                i % 2 === 0 ? (
                  <ArticleCard key={article.slug} article={article} index={i} />
                ) : null
              )}
            </div>

            <div className="flex flex-col gap-6 md:gap-8 md:mt-14">
              {(featuredArticles.length ? featuredArticles : articles.slice(0, 4)).map((article, i) =>
                i % 2 !== 0 ? (
                  <ArticleCard key={article.slug} article={article} index={i} />
                ) : null
              )}
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-24 cv-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="mb-12 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/60 pb-6"
          >
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime mb-2 flex items-center gap-2">
                <span aria-hidden className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)]" />
                Shipped architectures
              </p>
              <h2 className="font-display font-semibold text-[clamp(1.75rem,4vw,2.5rem)] text-zinc-50">
                Projects
              </h2>
            </div>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-[#0a0a0a] px-4 py-2 text-zinc-300 hover:border-electric-lime hover:text-electric-lime transition-colors text-[10px] font-mono uppercase tracking-widest"
            >
              View all <ArrowUpRight size={13} />
            </Link>
          </m.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <HomeProjectCard key={project.slug} project={project} index={i} />
            ))}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="max-w-4xl mx-auto px-6 md:px-8 py-20 cv-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="relative overflow-hidden rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] p-8 md:p-12 text-center"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent"
            />
            <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime mb-4">
              <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)] motion-safe:animate-pulse" />
              Dispatches · zero noise
            </div>
            <h2 className="font-display font-semibold text-2xl md:text-3xl text-zinc-100 mb-3">
              Join the Newsletter
            </h2>
            <p className="text-zinc-400 font-light mb-8 max-w-md mx-auto text-sm md:text-base">
              Decision tools for systems designers. Infrequent - confirm your email to join.
            </p>

            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto relative" onSubmit={handleSubscribe}>
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
                className="flex-1 rounded-full border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 font-mono placeholder:text-zinc-600"
                required
              />
              <Magnetic>
                <button
                  type="submit"
                  disabled={status === 'loading' || status === 'success'}
                  className="rounded-full bg-electric-lime px-6 py-3 text-zinc-950 hover:bg-electric-lime/90 font-mono text-xs font-semibold uppercase tracking-widest transition-colors active:scale-[0.98] disabled:opacity-50 min-w-[140px] flex items-center justify-center"
                >
                  {status === 'loading' ? (
                    <div className="size-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
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
  const divRef = useRef<HTMLAnchorElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!divRef.current || isFocused) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    setIsFocused(true);
    setOpacity(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    setOpacity(1);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.32, 0.72, 0, 1] }}
    >
      <Link
        ref={divRef}
        to={`/articles/${article.slug}`}
        onMouseMove={handleMouseMove}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="block group relative p-6 md:p-8 rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] hover:border-electric-lime/50 transition-all duration-300 overflow-hidden"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent"
        />
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, rgba(202,255,74,.05), transparent 40%)`,
          }}
        />
        <div className="relative z-10">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-electric-lime">
                <span aria-hidden className="size-1.5 rounded-full bg-electric-lime" />
                {article.form}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-zinc-400">
                {article.readingTime} min · {article.wordCount.toLocaleString()}w
              </span>
            </div>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-zinc-800/80 bg-zinc-950 text-zinc-500 transition-colors group-hover:border-electric-lime/50 group-hover:text-electric-lime">
              <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </div>
          </div>
          <h3 className="font-display font-semibold text-xl md:text-2xl text-zinc-100 mb-3 leading-snug group-hover:text-white transition-colors">
            {article.title}
          </h3>
          <p className="text-zinc-400 text-sm leading-relaxed line-clamp-3 font-light mb-5">
            {article.excerpt}
          </p>
          <div className="flex items-center justify-between gap-3 border-t border-zinc-900 pt-4">
            <div className="flex flex-wrap gap-1.5">
              {article.topics.slice(0, 2).map((topic) => (
                <span
                  key={topic}
                  className="rounded-full border border-zinc-800/80 bg-zinc-950 px-2.5 py-0.5 font-mono text-[10px] text-zinc-400"
                >
                  {topic}
                </span>
              ))}
            </div>
            <span className="font-mono text-[10px] uppercase tracking-widest tabular-nums text-zinc-500">
              {article.date}
            </span>
          </div>
        </div>
      </Link>
    </m.div>
  );
}
