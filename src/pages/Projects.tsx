import { m } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Check, ExternalLink, Github, Trophy } from 'lucide-react';
import { projects, Project } from '../lib/projects';
import { mergedPrs, projectStats, receiptRows } from '../lib/upstreamLedger';
import SEO from '../components/SEO';
import ProjectSignature from '../components/ProjectSignature';

const label = 'font-mono text-[10px] uppercase tracking-[0.22em]';

export default function Projects() {
  const upstreamReposCount = projectStats(mergedPrs).length;
  const testedUpstreamCount = mergedPrs.filter((p) => p.test).length;
  const liveProjectsCount = projects.filter((p) => p.status === 'Live').length;
  const categories = [...new Set(projects.map((p) => p.category))];
  const awardedProjectsCount = projects.filter((p) => p.award).length;

  return (
    <div className="min-h-screen overflow-x-clip pt-32 pb-24">
      <SEO
        title="Projects | Aditya Gaurav - AI Engineer & Systems Architect"
        description="Shipping AI products: 3D engineering engine (FRIDAY), competitive intelligence (Sentinel), context circuit-breaker (MidSphere), and more."
        canonicalUrl="https://www.adityaai.dev/projects"
        breadcrumbs={[
          { name: 'Home', url: 'https://www.adityaai.dev/' },
          { name: 'Projects', url: 'https://www.adityaai.dev/projects' },
        ]}
      />

      <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-12 md:py-16">
        <m.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="relative mb-14 border-b border-zinc-800/60 pb-10"
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
              Lab · production systems
            </p>
            <Link
              to="/upstream"
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-[#0a0a0a] px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:border-electric-lime hover:text-electric-lime"
            >
              Upstream ledger ({mergedPrs.length}) <ArrowUpRight size={12} />
            </Link>
          </div>

          <h1 className="font-display font-semibold text-[clamp(2.5rem,8vw,4rem)] leading-[1.08] tracking-[-0.02em] text-zinc-50 mb-4">
            Projects
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
            Shipped products and platforms. Each one built end-to-end: architecture, code,
            deployment, docs. Click any card for the full engineering write-up.
          </p>

          {/* 4-Tile Lab Telemetry Bar */}
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-800/60 lg:grid-cols-4">
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Flagship systems</dt>
              <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
                {projects.length}
              </dd>
              <p className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-400">
                {liveProjectsCount} of {projects.length} live in production
              </p>
            </div>
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Form factors</dt>
              <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
                {categories.length}
              </dd>
              <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
                {categories.join(' · ')}
              </p>
            </div>
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Global recognition</dt>
              <dd className="mt-2 font-sans text-2xl sm:text-3xl font-semibold tracking-tight text-amber-300 md:text-4xl">
                {awardedProjectsCount > 0 ? 'Winner' : 'Shipped'}
              </dd>
              <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
                {projects.find((p) => p.award)?.award?.label ?? 'Production AI systems'}
              </p>
            </div>
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Open-source impact</dt>
              <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-electric-lime md:text-5xl">
                <Link
                  to="/upstream"
                  aria-label={`Open the upstream ledger, ${mergedPrs.length} merged pull requests`}
                  className="group inline-flex items-center gap-1.5 transition-colors hover:text-white"
                >
                  {mergedPrs.length}
                  <ArrowUpRight
                    size={18}
                    aria-hidden
                    className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                  />
                </Link>
              </dd>
              <p className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-400">
                Merged PRs across {upstreamReposCount} repos ({testedUpstreamCount} tested)
              </p>
            </div>
          </dl>
        </m.header>

        <div className="grid grid-cols-1 gap-6 md:gap-8">
          {projects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </div>
      </section>

      {/* Curated upstream receipts. Static. Not a live GitHub feed. */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 pt-8 pb-20 cv-auto">
        <m.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
          className="relative overflow-hidden rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] p-6 md:p-10"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent"
          />
          <div className="mb-8 border-b border-zinc-800/70 pb-6">
            <p className={`${label} mb-2 flex items-center gap-2 text-electric-lime`}>
              <span aria-hidden className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)]" />
              Selected upstream receipts
            </p>
            <h2 className="font-display font-semibold text-[clamp(1.5rem,3.5vw,2.25rem)] leading-tight tracking-[-0.02em] text-zinc-50">
              Critical impacts in open source
            </h2>
          </div>

          <ul className="divide-y divide-zinc-800/70">
            {receiptRows.map(({ receipt, pr }) => (
              <li
                key={receipt.url}
                className="transition-colors sm:-mx-3 sm:rounded-2xl sm:hover:bg-zinc-900/35"
              >
                <a
                  href={receipt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-wrap items-center gap-x-2.5 gap-y-1.5 py-5 sm:px-3"
                >
                  <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-zinc-200">
                    {receipt.org}/{receipt.repo}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-widest tabular-nums text-electric-lime">
                    #{receipt.pr}
                  </span>
                  <span className="order-last w-full font-sans text-sm leading-relaxed text-zinc-300 transition-colors group-hover:text-zinc-100 md:text-base">
                    {receipt.short}
                  </span>
                  {pr?.test && (
                    <span
                      title="Ships a regression test"
                      className="inline-flex items-center gap-1 rounded-md border border-electric-lime/30 bg-electric-lime/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-electric-lime"
                    >
                      <Check size={10} strokeWidth={3} aria-hidden />
                      test
                    </span>
                  )}
                  <ArrowUpRight
                    size={14}
                    aria-hidden
                    className="ml-auto shrink-0 text-zinc-500 transition-colors group-hover:text-electric-lime"
                  />
                </a>
              </li>
            ))}
          </ul>

          <p className="mt-6 font-mono text-[11px] text-zinc-400">
            Full write-ups for all {mergedPrs.length} merged fixes live in{' '}
            <Link to="/upstream" className="text-electric-lime transition-colors hover:underline">
              the upstream ledger
            </Link>
            .
          </p>
        </m.div>
      </section>
    </div>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.32, 0.72, 0, 1] }}
    >
      <div className="group relative rounded-3xl overflow-hidden border border-zinc-800/70 bg-[#0a0a0a] hover:border-zinc-600 transition-all duration-500">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 z-20 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent transition-opacity group-hover:via-electric-lime/50"
        />

        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr]">
          {/* Text side */}
          <Link
            to={`/projects/${project.slug}`}
            className="p-8 md:p-10 lg:p-12 flex flex-col justify-between min-h-[380px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime"
          >
            <div>
              <div className="flex items-center gap-2.5 font-mono text-[10px] uppercase tracking-widest mb-6 flex-wrap">
                <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 text-electric-lime">
                  {project.category}
                </span>
                <span className="text-zinc-700">•</span>
                <span className="tabular-nums text-zinc-400">{project.year}</span>
                <span className="text-zinc-700">•</span>
                <span className="flex items-center gap-1.5 text-zinc-300">
                  <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
                  {project.status}
                </span>
                {project.award && (
                  <>
                    <span className="text-zinc-700">•</span>
                    <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-300">
                      <Trophy size={11} className="shrink-0" />
                      {project.award.label}
                    </span>
                  </>
                )}
              </div>

              <h2 className="font-display font-semibold text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em] text-zinc-50 group-hover:text-white transition-colors mb-2.5">
                {project.name}
              </h2>

              <p className={`font-display font-medium text-base md:text-lg leading-tight ${project.accent} mb-4`}>
                {project.tagline}
              </p>

              <p className="text-zinc-400 text-sm md:text-base leading-relaxed line-clamp-3 mb-6">
                {project.excerpt}
              </p>

              {/* Inline Project Telemetry Strip */}
              <dl className="grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-800/60">
                {project.metrics.map((mItem) => (
                  <div key={mItem.label} className="bg-zinc-950/90 p-3">
                    <dt className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                      {mItem.label}
                    </dt>
                    <dd className={`mt-1 font-mono text-xs md:text-sm font-semibold tabular-nums ${project.accent}`}>
                      {mItem.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-900 pt-5">
              <div className="flex flex-wrap gap-1.5">
                {project.stack.slice(0, 5).map((tech) => (
                  <span
                    key={tech}
                    className="border border-zinc-800 bg-zinc-950 text-zinc-300 rounded-full px-3 py-1 text-[10px] font-mono"
                  >
                    {tech}
                  </span>
                ))}
                {project.stack.length > 5 && (
                  <span className="text-zinc-500 text-[10px] font-mono self-center tabular-nums">
                    +{project.stack.length - 5}
                  </span>
                )}
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-400 group-hover:text-electric-lime transition-colors inline-flex items-center gap-1">
                Read write-up <ArrowUpRight size={12} />
              </span>
            </div>
          </Link>

          {/* Visual side */}
          <div className="relative bg-[#070707] border-t md:border-t-0 md:border-l border-zinc-800/60 overflow-hidden">
            <ProjectSignature slug={project.slug} />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/50 pointer-events-none" />
            <Link
              to={`/projects/${project.slug}`}
              tabIndex={-1}
              aria-label={`Open ${project.name} write-up`}
              className="absolute inset-0 z-10"
            />

            <div className="relative z-20 h-full min-h-[240px] md:min-h-[380px] flex flex-col justify-between p-6 md:p-8 pointer-events-none">
              <div className="flex justify-end">
                <div className="bg-zinc-950/85 backdrop-blur border border-zinc-800/80 rounded-full p-2.5 group-hover:border-electric-lime transition-colors">
                  <ArrowUpRight
                    size={16}
                    className="text-zinc-400 group-hover:text-electric-lime transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pointer-events-auto">
                <ExternalActionChip href={project.liveUrl} icon={<ExternalLink size={12} />}>
                  Demo
                </ExternalActionChip>
                <ExternalActionChip href={project.codeUrl} icon={<Github size={12} />}>
                  Code
                </ExternalActionChip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </m.div>
  );
}

function ExternalActionChip({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex items-center gap-1.5 bg-zinc-950/85 backdrop-blur border border-zinc-800/80 hover:border-electric-lime hover:text-electric-lime rounded-full px-3.5 py-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-200 transition-colors"
    >
      {icon}
      {children}
    </a>
  );
}
