import { m } from 'motion/react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import { SiUdemy, SiOpenai, SiGooglecloud, SiKaggle } from 'react-icons/si';
import { ArrowUpRight, Trophy } from 'lucide-react';
import { articles } from '../lib/articles';
import { projects } from '../lib/projects';
import { mergedPrs } from '../lib/upstreamLedger';

const label = 'font-mono text-[10px] uppercase tracking-[0.22em]';

const OracleIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M4 0C1.79 0 0 1.79 0 4V20C0 22.21 1.79 24 4 24H20C22.21 24 24 22.21 24 20V4C24 1.79 22.21 0 20 0H4ZM15.5 7.5H8.5C6.01 7.5 4 9.51 4 12C4 14.49 6.01 16.5 8.5 16.5H15.5C17.99 16.5 20 14.49 20 12C20 9.51 17.99 7.5 15.5 7.5ZM8.5 10H15.5C16.6 10 17.5 10.9 17.5 12C17.5 13.1 16.6 14 15.5 14H8.5C7.4 14 6.5 13.1 6.5 12C6.5 10.9 7.4 10 8.5 10Z" />
  </svg>
);

const oracleCertifications = [
  {
    title: 'AI Vector Search Professional',
    domain: 'Vector Indexing · Hybrid Retrieval',
    url: 'https://catalog-education.oracle.com/ords/certview/sharebadge?id=5E4FDD09770E6D237020A75DD7D9024DDDF4142098FA1641EAAB2CB8D2B2B69F',
  },
  {
    title: 'Cloud Infrastructure Associate',
    domain: 'Distributed Compute · Networking',
    url: 'https://catalog-education.oracle.com/ords/certview/sharebadge?id=303E588DC05D0D742ED0260BD00EFB0396791BC84690D91BF007C884D8F85FED',
  },
  {
    title: 'Data Platform Associate',
    domain: 'Autonomous Data · Pipelines',
    url: 'https://catalog-education.oracle.com/ords/certview/sharebadge?id=1A6F1D38013F675295039B1C4A4A2209D6F1E280BD6D04B3E42112B8200F19F0',
  },
  {
    title: 'Data Science Professional',
    domain: 'Model Lifecycle · Production ML',
    url: 'https://catalog-education.oracle.com/ords/certview/sharebadge?id=1A6F1D38013F675295039B1C4A4A22090C00355209CE06886B95D7DF8D8D08CB',
  },
];

const otherCertifications = [
  {
    title: 'Google Cloud Certifications',
    issuer: 'Google Cloud · Verified Credly Badges',
    icon: SiGooglecloud,
    url: 'https://www.credly.com/users/aditya-gaurav.12219822/badges#credly',
  },
  {
    title: 'OpenAI GenAI Certified',
    issuer: 'OpenAI / NxtWave Buildathon',
    icon: SiOpenai,
    url: 'https://openai-buildathon.nxtwave.tech/certificate?cid=0VTIX2094G',
  },
  {
    title: 'UI UX Mastery Certificate',
    issuer: 'Udemy · Product Interface Design',
    icon: SiUdemy,
    url: 'https://www.udemy.com/certificate/UC-475e9e06-bb3b-4c97-812a-24846c95c368/',
  },
];

const focusDomains = [
  {
    layer: '01 · Harnesses',
    title: 'Cognitive & Agentic Architecture',
    summary:
      'State machines, context circuit-breakers, and deterministic verification loops that keep multi-step agents reliable in production.',
    href: '/articles/software-3-architecting-ai',
    cta: 'Read Software 3.0',
  },
  {
    layer: '02 · Economics & State',
    title: 'Inference & Memory Systems',
    summary:
      'Prompt-cache topology, provider template transforms, and layered episodic/semantic memory stacks tuned for cost and latency.',
    href: '/articles/inference-economics-for-agents',
    cta: 'Read Inference Economics',
  },
  {
    layer: '03 · Execution',
    title: 'Sandboxes & Open-Source Infrastructure',
    summary:
      'MicroVM/gVisor isolation boundaries, MCP security surfaces, and upstream kernel/runtime bug fixes with regression proofs.',
    href: '/upstream',
    cta: 'Explore Upstream Ledger',
  },
];

export default function About() {
  const totalCerts = oracleCertifications.length + otherCertifications.length;

  return (
    <div className="min-h-screen overflow-x-clip pt-32 pb-24">
      <SEO
        title="About | Aditya Gaurav - AI Researcher · Systems Architect"
        description="AI Researcher & Systems Architect building cognitive architectures, agentic workflows, and the MCP ecosystem. Kaggle winner, Oracle certified, research archive on AI systems."
        canonicalUrl="https://www.adityaai.dev/about"
        ogType="profile"
        breadcrumbs={[
          { name: 'Home', url: 'https://www.adityaai.dev/' },
          { name: 'About', url: 'https://www.adityaai.dev/about' },
        ]}
      />

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-12 md:py-16">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="relative mb-16 border-b border-zinc-800/60 pb-12"
        >
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
              Profile · AI Researcher & Systems Architect
            </p>
            <span className="font-mono text-[11px] text-zinc-500">adityaai.dev lab</span>
          </div>

          <h1 className="font-display font-semibold text-[clamp(2.5rem,8vw,4rem)] leading-[1.08] tracking-[-0.02em] text-zinc-50 mb-8">
            About
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-12 items-center">
            <div>
              <p className="text-zinc-300 text-lg md:text-xl leading-relaxed mb-6 font-light">
                I am an AI Researcher & Systems Architect focused on cognitive architectures and scalable intelligence. My work bridges the gap between theoretical AI models and production-ready systems.
              </p>
              <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8 font-light">
                With a deep focus on agentic workflows, large language models, and scalable inference, I build systems that don't just predict the next token, but actively plan, reason, and execute complex tasks.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-2 rounded-full bg-electric-lime px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-widest text-zinc-950 transition-colors hover:bg-electric-lime/90"
                >
                  Inspect shipped systems <ArrowUpRight size={14} />
                </Link>
                <Link
                  to="/articles"
                  className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#0a0a0a] px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-zinc-300 transition-colors hover:border-electric-lime hover:text-electric-lime"
                >
                  Read research shelf <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="relative rounded-3xl border border-zinc-800/80 bg-[#0a0a0a] p-6 md:p-8 overflow-hidden">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent"
                />
                <img
                  src="/assets/aditya-gaurav.webp"
                  alt="Aditya Gaurav"
                  className="aspect-square w-full max-w-[240px] md:max-w-[260px] rounded-2xl object-cover object-center opacity-95 hover:opacity-100 transition-opacity duration-500 mx-auto"
                  loading="lazy"
                  decoding="async"
                  width={800}
                  height={800}
                />
                <div className="mt-4 border-t border-zinc-900 pt-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-widest text-zinc-400">
                  <span>Aditya Gaurav</span>
                  <span className="text-electric-lime">Systems Lab</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4-Tile Profile Telemetry Strip */}
          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-800/60 lg:grid-cols-4">
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Global Hackathon</dt>
              <dd className="mt-2 font-sans text-3xl font-semibold tracking-tight text-amber-300 md:text-4xl">
                Winner
              </dd>
              <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
                DeepMind × Kaggle Top 50
              </p>
            </div>
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Credentials</dt>
              <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
                {totalCerts}
              </dd>
              <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
                Oracle · Google Cloud · OpenAI
              </p>
            </div>
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Published research</dt>
              <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
                {articles.length}
              </dd>
              <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
                {projects.length} production systems shipped
              </p>
            </div>
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Upstream fixes</dt>
              <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-electric-lime md:text-5xl">
                {mergedPrs.length}
              </dd>
              <p className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-400">
                Merged in TensorFlow, gVisor & more
              </p>
            </div>
          </dl>
        </m.div>

        {/* Research & Engineering Focus Pillars */}
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="mb-20"
        >
          <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className={`${label} mb-2 text-electric-lime`}>Core thesis</p>
              <h2 className="font-display font-semibold text-[clamp(1.5rem,3.5vw,2.25rem)] text-zinc-50">
                Architectural focus areas
              </h2>
            </div>
            <span className={`${label} text-zinc-500`}>From model weights to runtime guarantees</span>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {focusDomains.map((d) => (
              <Link
                key={d.layer}
                to={d.href}
                className="group relative flex flex-col justify-between rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] p-6 md:p-8 transition-all duration-300 hover:border-electric-lime/50"
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent"
                />
                <div>
                  <p className={`${label} mb-3 text-electric-lime`}>{d.layer}</p>
                  <h3 className="font-display text-xl font-semibold text-zinc-100 group-hover:text-white transition-colors mb-3">
                    {d.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-400 font-light mb-6">
                    {d.summary}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-electric-lime transition-colors">
                  {d.cta}
                  <ArrowUpRight
                    size={13}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
              </Link>
            ))}
          </div>
        </m.div>
      </section>

      {/* Certifications Section */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 pb-16 cv-auto">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/60 pb-6">
            <div>
              <p className={`${label} mb-2 flex items-center gap-2 text-electric-lime`}>
                <Trophy size={13} className="text-electric-lime" />
                Verified credentials
              </p>
              <h2 className="font-display font-semibold text-[clamp(1.75rem,4vw,2.5rem)] text-zinc-50">
                Honors & Certifications
              </h2>
            </div>
            <span className="font-mono text-xs tabular-nums text-zinc-500">
              1 global award · {totalCerts} industry certifications
            </span>
          </div>

          {/* Featured Competition Award */}
          <a
            href="https://www.kaggle.com/competitions/gemini-3/writeups/new-writeup-1765520565551"
            target="_blank"
            rel="noopener noreferrer"
            className="mb-8 block bg-[#0a0a0a] border border-zinc-800/70 hover:border-amber-400/50 rounded-3xl p-8 md:p-10 relative overflow-hidden group transition-all"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent"
            />
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
              <SiKaggle size={180} className="text-zinc-500" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start md:items-center gap-6">
                <div className="size-14 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/30 text-amber-300 shrink-0">
                  <Trophy size={28} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5 mb-2.5 flex-wrap">
                    <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-300 font-semibold">
                      Global Winner · Developer Tools
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                      Top 50 Worldwide
                    </span>
                  </div>
                  <h3 className="font-display text-2xl md:text-3xl font-semibold text-zinc-100 group-hover:text-white transition-colors mb-2">
                    Kaggle × Google DeepMind Gemini 3 Pro Hackathon
                  </h3>
                  <p className="text-zinc-400 text-base font-light max-w-2xl leading-relaxed">
                    Awarded for F.R.I.D.A.Y, a generative 3D visual engine built on Gemini 3 Pro, Three.js, and spatial assembly synthesis.
                  </p>
                </div>
              </div>
              <div className="size-11 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:border-amber-400 group-hover:bg-amber-400/10 transition-all shrink-0 self-end md:self-auto">
                <ArrowUpRight size={20} className="text-zinc-400 group-hover:text-amber-300 transition-colors" />
              </div>
            </div>
          </a>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            {/* Oracle Certifications Bento Box */}
            <div className="bg-[#0a0a0a] border border-zinc-800/70 rounded-3xl p-7 md:p-9 relative overflow-hidden group hover:border-zinc-700 transition-colors">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent"
              />
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <OracleIcon size={180} className="text-zinc-500" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-4 mb-7 border-b border-zinc-900 pb-5">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-xl bg-red-500/10 flex items-center justify-center border border-red-500/25">
                      <OracleIcon className="text-red-500" size={24} />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-2xl text-zinc-100">Oracle Certified</h3>
                      <p className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                        Cloud · Vector Search · Data Science
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 font-mono text-xs tabular-nums text-zinc-300">
                    {oracleCertifications.length} badges
                  </span>
                </div>

                <div className="flex flex-col gap-3">
                  {oracleCertifications.map((cert) => (
                    <a
                      key={cert.url}
                      href={cert.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/70 hover:border-electric-lime/50 hover:bg-zinc-900/60 transition-all group/item"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="text-zinc-200 font-medium group-hover/item:text-electric-lime transition-colors truncate">
                          {cert.title}
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">
                          {cert.domain}
                        </div>
                      </div>
                      <ArrowUpRight
                        size={16}
                        className="shrink-0 text-zinc-500 group-hover/item:text-electric-lime transition-all group-hover/item:translate-x-0.5 group-hover/item:-translate-y-0.5"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Other Certifications Grid */}
            <div className="grid grid-rows-3 gap-4 md:gap-5">
              {otherCertifications.map((cert) => (
                <a
                  key={cert.url}
                  href={cert.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#0a0a0a] border border-zinc-800/70 rounded-3xl p-6 md:p-7 flex items-center justify-between group hover:border-electric-lime/50 transition-all relative overflow-hidden"
                >
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent"
                  />
                  <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 group-hover:-rotate-12 duration-500 pointer-events-none">
                    <cert.icon size={120} className="text-zinc-500" />
                  </div>

                  <div className="relative z-10 flex items-center gap-5 min-w-0 pr-4">
                    <div className="size-12 shrink-0 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:border-electric-lime/40 transition-colors">
                      <cert.icon className="text-zinc-300 group-hover:text-electric-lime transition-colors" size={22} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-lg md:text-xl text-zinc-100 mb-1 group-hover:text-white transition-colors truncate">
                        {cert.title}
                      </h3>
                      <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest truncate">
                        {cert.issuer}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-10 size-10 shrink-0 rounded-full bg-zinc-950 flex items-center justify-center border border-zinc-800 group-hover:border-electric-lime group-hover:bg-electric-lime/10 transition-all">
                    <ArrowUpRight
                      size={17}
                      className="text-zinc-400 group-hover:text-electric-lime transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </m.div>
      </section>
    </div>
  );
}
