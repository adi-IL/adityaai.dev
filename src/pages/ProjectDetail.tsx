import { useParams, Link } from 'react-router-dom';
import { useMemo, useState, memo } from 'react';
import { m, useScroll } from 'motion/react';
import { ArrowLeft, ArrowUpRight, Check, ExternalLink, Github, Share2, Trophy } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getProjectBySlug, projects } from '../lib/projects';
import SEO from '../components/SEO';
import NewsletterPrompt from '../components/NewsletterPrompt';
import ProjectSignature from '../components/ProjectSignature';
import Magnetic from '../components/Magnetic';
import FixedBackButton from '../components/FixedBackButton';

const label = 'font-mono text-[10px] uppercase tracking-[0.22em]';

/**
 * Memoised project body. Keeps the heavy markdown render referentially
 * stable across parent state changes (share button toggle, etc.) so
 * scrolling doesn't trigger a re-parse of the full project long-form.
 */
const ProjectMarkdown = memo(function ProjectMarkdown({ content }: { content: string }) {
  return (
    <Markdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: ({ ...props }) => (
          <div className="my-8 w-full overflow-x-auto rounded-2xl border border-zinc-800/80 bg-[#0a0a0a]">
            <table className="w-full border-collapse text-left text-sm whitespace-nowrap" {...props} />
          </div>
        ),
        thead: ({ ...props }) => <thead className="border-b border-zinc-800 bg-zinc-900/60 font-mono text-xs uppercase tracking-wider" {...props} />,
        th: ({ ...props }) => (
          <th className="border-b border-zinc-800/70 px-4 py-3 font-semibold text-zinc-200" {...props} />
        ),
        td: ({ ...props }) => (
          <td className="border-b border-zinc-900 px-4 py-3 text-zinc-300 tabular-nums" {...props} />
        ),
        tr: ({ ...props }) => <tr className="last:border-0 hover:bg-zinc-900/30" {...props} />,
      }}
    >
      {content}
    </Markdown>
  );
});

export default function ProjectDetail() {
  const { scrollYProgress } = useScroll();
  const { slug } = useParams();
  const project = slug ? getProjectBySlug(slug) : undefined;
  const [isShared, setIsShared] = useState(false);
  const projectContent = useMemo(() => project?.content ?? '', [project]);

  if (!project) {
    return (
      <div className="min-h-screen pt-40 pb-16 flex flex-col items-center justify-center text-center px-6">
        <div className="max-w-lg rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] p-10 md:p-12">
          <p className={`${label} mb-3 text-electric-lime`}>404 · Registry lookup</p>
          <h1 className="font-display font-semibold text-3xl md:text-4xl text-zinc-50 mb-4">Project Not Found</h1>
          <p className="text-zinc-400 mb-8 text-sm md:text-base leading-relaxed">
            The project you're looking for doesn't exist or has been moved.
          </p>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 rounded-full border border-electric-lime bg-electric-lime/10 px-5 py-2.5 font-mono text-xs uppercase tracking-widest text-electric-lime transition-colors hover:bg-electric-lime hover:text-zinc-950"
          >
            <ArrowLeft size={14} />
            Return to Projects
          </Link>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    const shareData = {
      title: project.name,
      text: `Check out this project: ${project.name} - ${project.tagline}`,
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
        title={`${project.name} - ${project.tagline} | Aditya Gaurav`}
        description={project.excerpt}
        canonicalUrl={`https://www.adityaai.dev/projects/${project.slug}`}
        ogType="website"
        ogImage={project.ogImage}
        breadcrumbs={[
          { name: 'Home', url: 'https://www.adityaai.dev/' },
          { name: 'Projects', url: 'https://www.adityaai.dev/projects' },
          { name: project.name, url: `https://www.adityaai.dev/projects/${project.slug}` },
        ]}
      />

      {/* Fixed back pill owns its own scroll state so the heavy project
          body below never re-renders when the threshold flips. */}
      <FixedBackButton to="/projects" />

      <article className="max-w-4xl mx-auto px-6 md:px-8 py-12">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
        >
          <div className="mb-10 flex items-center justify-between gap-4">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-[#0a0a0a] px-4 py-1.5 text-zinc-400 hover:border-zinc-600 hover:text-zinc-100 transition-colors font-mono text-[10px] uppercase tracking-widest"
            >
              <ArrowLeft size={13} />
              Back to Projects
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

          {/* Header */}
          <header className="mb-12">
            <div className="flex flex-wrap items-center gap-2.5 font-mono text-[10px] uppercase tracking-widest mb-6">
              <span className="rounded-md border border-zinc-800 bg-[#0a0a0a] px-2.5 py-1 text-electric-lime">
                {project.category}
              </span>
              <span className="text-zinc-700">•</span>
              <span className="tabular-nums text-zinc-400">{project.year}</span>
              <span className="text-zinc-700">•</span>
              <span className="flex items-center gap-2 text-zinc-300">
                <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
                {project.status}
              </span>
              {project.award && (
                <>
                  <span className="text-zinc-700">•</span>
                  <a
                    href={project.award.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-300 hover:border-amber-400 hover:text-amber-200 transition-colors"
                  >
                    <Trophy size={12} className="shrink-0" />
                    <span>{project.award.label}</span>
                  </a>
                </>
              )}
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-center">
              <div>
                <h1 className="font-display font-semibold text-[clamp(2.5rem,6vw,4.25rem)] leading-[1.05] tracking-[-0.02em] text-zinc-50 mb-4">
                  {project.name}
                </h1>

                <p
                  className={`font-display font-medium text-[clamp(1.25rem,2.5vw,1.65rem)] leading-tight ${project.accent} mb-5`}
                >
                  {project.tagline}
                </p>

                <p className="text-zinc-400 text-base md:text-lg leading-relaxed mb-8">
                  {project.excerpt}
                </p>

                {/* Action bar */}
                <div className="flex flex-wrap gap-3">
                  <Magnetic>
                    <a
                      href={project.liveUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-electric-lime text-zinc-950 hover:bg-electric-lime/90 rounded-full px-5 py-2.5 text-xs uppercase tracking-widest font-mono font-semibold transition-colors active:scale-[0.98] shadow-[0_0_0_0_rgba(202,255,74,0)] hover:shadow-[0_0_24px_0_rgba(202,255,74,0.25)]"
                    >
                      <ExternalLink size={14} />
                      Live Demo
                    </a>
                  </Magnetic>
                  <Magnetic>
                    <a
                      href={project.codeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 border border-zinc-800 bg-[#0a0a0a] text-zinc-200 hover:border-electric-lime hover:text-electric-lime rounded-full px-5 py-2.5 text-xs uppercase tracking-widest font-mono transition-colors active:scale-[0.98]"
                    >
                      <Github size={14} />
                      Source
                    </a>
                  </Magnetic>
                  {project.award && (
                    <Magnetic>
                      <a
                        href={project.award.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:border-amber-400 hover:text-amber-200 rounded-full px-5 py-2.5 text-xs uppercase tracking-widest font-mono transition-colors active:scale-[0.98]"
                      >
                        <Trophy size={14} />
                        Kaggle Writeup
                      </a>
                    </Magnetic>
                  )}
                </div>
              </div>

              {/* Signature Architecture Preview */}
              <div className="relative h-56 md:h-64 overflow-hidden rounded-3xl border border-zinc-800/80 bg-[#0a0a0a]">
                <ProjectSignature slug={project.slug} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between border-t border-zinc-900/80 bg-zinc-950/80 px-4 py-2.5 backdrop-blur">
                  <span className={`${label} text-zinc-400`}>System signature</span>
                  <span className={`font-mono text-[10px] uppercase tracking-widest ${project.accent}`}>
                    {project.slug}.adityaai.dev
                  </span>
                </div>
              </div>
            </div>
          </header>

          {/* 3-Tile Project Telemetry Bar */}
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-px overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-800/60 mb-10">
            {project.metrics.map((metric) => (
              <div key={metric.label} className="bg-[#0a0a0a] p-5 md:p-6">
                <dt className={`${label} text-zinc-400`}>{metric.label}</dt>
                <dd className={`mt-2 font-sans text-3xl md:text-4xl font-semibold tracking-tight ${project.accent}`}>
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>

          {/* Stack pills */}
          <div className="mb-16 rounded-2xl border border-zinc-800/70 bg-[#0a0a0a] p-5 md:p-6">
            <div className={`${label} text-zinc-400 mb-3.5 flex items-center gap-2`}>
              <span aria-hidden className="size-1.5 rounded-full bg-electric-lime" />
              Production stack & runtime
            </div>
            <div className="flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="border border-zinc-800 bg-zinc-950 text-zinc-200 rounded-full px-4 py-1.5 text-xs font-mono"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Long-form content (memoised body stays referentially stable
              across parent state changes so scroll never triggers a re-parse) */}
          <div className="article-body prose prose-invert prose-zinc max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-electric-lime hover:prose-a:text-electric-lime/80 prose-p:leading-[1.75] prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-zinc-100 prose-code:text-electric-lime prose-code:bg-zinc-900/60 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-zinc-800/80 prose-pre:rounded-2xl">
            <ProjectMarkdown content={projectContent} />
          </div>

          {/* Footer */}
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

            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-electric-lime hover:text-electric-lime rounded-full px-5 py-2.5 text-xs uppercase tracking-widest font-mono transition-colors active:scale-[0.98]"
              >
                {isShared ? <Check size={13} className="text-electric-lime" /> : <Share2 size={13} />}
                {isShared ? 'Link Copied' : 'Share'}
              </button>
              <Link
                to="/projects"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-zinc-800 bg-zinc-950 text-zinc-200 hover:border-electric-lime hover:text-electric-lime rounded-full px-5 py-2.5 text-xs uppercase tracking-widest font-mono transition-colors active:scale-[0.98]"
              >
                All Projects
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          <NewsletterPrompt
            headline="Follow the lab."
            subhead="I ship every new project, essay, and experiment to the newsletter first. One short email when there's something worth your time."
          />

          {/* Sibling projects: highlight the other two so visitors can cross the lab */}
          <section
            aria-labelledby="sibling-projects-heading"
            className="mt-20 pt-12 border-t border-zinc-800/60"
          >
            <div className="flex items-center gap-2.5 mb-8 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-400">
              <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
              <h2 id="sibling-projects-heading">Other projects in the lab</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {projects
                .reduce<(typeof projects)>((acc, p) => {
                  if (p.slug !== project.slug) acc.push(p);
                  return acc;
                }, [])
                .map((p, i) => (
                  <m.div
                    key={p.slug}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
                  >
                    <Link
                      to={`/projects/${p.slug}`}
                      className="group relative block h-full rounded-3xl border border-zinc-800/70 hover:border-electric-lime/50 transition-all duration-300 overflow-hidden bg-[#0a0a0a]"
                    >
                      <div className="relative h-32 overflow-hidden bg-[#070707] border-b border-zinc-800/60">
                        <ProjectSignature slug={p.slug} />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a] pointer-events-none" />
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`font-mono text-[10px] uppercase tracking-widest ${p.accent}`}>
                            {p.category} · {p.year}
                          </span>
                          <ArrowUpRight
                            size={15}
                            className="text-zinc-600 group-hover:text-electric-lime transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          />
                        </div>
                        <h3 className="font-display font-semibold text-xl text-zinc-100 leading-tight mb-1.5 group-hover:text-white transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 font-light">
                          {p.tagline}
                        </p>
                      </div>
                    </Link>
                  </m.div>
                ))}
            </div>
          </section>
        </m.div>
      </article>
    </div>
  );
}
