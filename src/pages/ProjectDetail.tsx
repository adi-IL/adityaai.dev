import { useParams, Link } from 'react-router-dom';
import { useMemo, useState, memo } from 'react';
import { m } from 'motion/react';
import { ArrowLeft, ArrowUpRight, ExternalLink, Github } from 'lucide-react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getProjectBySlug, projects } from '../lib/projects';
import SEO from '../components/SEO';
import NewsletterPrompt from '../components/NewsletterPrompt';
import ProjectSignature from '../components/ProjectSignature';
import Magnetic from '../components/Magnetic';
import FixedBackButton from '../components/FixedBackButton';

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
          <div className="overflow-x-auto w-full my-8 rounded-lg border border-zinc-800/50">
            <table className="w-full text-left border-collapse text-sm whitespace-nowrap" {...props} />
          </div>
        ),
        thead: ({ ...props }) => <thead className="bg-zinc-900/50" {...props} />,
        th: ({ ...props }) => (
          <th className="border-b border-zinc-800/50 py-3 px-4 text-zinc-300 font-semibold" {...props} />
        ),
        td: ({ ...props }) => (
          <td className="border-b border-zinc-800/50 py-3 px-4 text-zinc-400" {...props} />
        ),
        tr: ({ ...props }) => <tr className="last:border-0" {...props} />,
      }}
    >
      {content}
    </Markdown>
  );
});

export default function ProjectDetail() {
  const { slug } = useParams();
  const project = slug ? getProjectBySlug(slug) : undefined;
  const [isShared, setIsShared] = useState(false);
  const projectContent = useMemo(() => project?.content ?? '', [project]);

  if (!project) {
    return (
      <div className="min-h-screen pt-40 pb-16 flex flex-col items-center justify-center text-center px-6">
        <h1 className="font-display font-semibold text-4xl text-zinc-50 mb-4">Project Not Found</h1>
        <p className="text-zinc-400 mb-8">
          The project you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/projects" className="text-electric-lime hover:underline">
          Return to Projects
        </Link>
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
    <div className="min-h-screen pt-32 pb-16">
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
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 py-2 text-zinc-600 hover:text-zinc-400 transition-colors mb-12 font-mono text-xs uppercase tracking-widest"
          >
            <ArrowLeft size={14} />
            Back to Projects
          </Link>

          {/* Header */}
          <header className="mb-12">
            <div className="flex flex-wrap items-center gap-3 font-mono text-xs uppercase tracking-widest mb-6">
              <span className="text-electric-lime">{project.category}</span>
              <span className="text-zinc-700">•</span>
              <span className="text-zinc-500">{project.year}</span>
              <span className="text-zinc-700">•</span>
              <span className="flex items-center gap-2 text-zinc-400">
                <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
                {project.status}
              </span>
            </div>

            <h1 className="font-display font-semibold text-[clamp(2.5rem,6vw,4.5rem)] leading-[1.05] tracking-[-0.02em] text-zinc-50 mb-6">
              {project.name}
            </h1>

            <p
              className={`font-display font-medium text-[clamp(1.25rem,2.5vw,1.75rem)] leading-tight ${project.accent} mb-8`}
            >
              {project.tagline}
            </p>

            <p className="text-zinc-400 text-lg leading-relaxed max-w-3xl">
              {project.excerpt}
            </p>
          </header>

          {/* Action bar */}
          <div className="flex flex-wrap gap-3 mb-12">
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
                className="inline-flex items-center gap-2 border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 rounded-full px-5 py-2.5 text-xs uppercase tracking-widest font-mono transition-colors active:scale-[0.98]"
              >
                <Github size={14} />
                Source
              </a>
            </Magnetic>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-16 pb-12 border-b border-zinc-800/50">
            {project.metrics.map((metric, i) => (
              <m.div
                key={metric.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.2 + i * 0.08,
                  ease: [0.32, 0.72, 0, 1],
                }}
                className="border-t border-zinc-800/50 pt-4"
              >
                <div className={`font-display font-semibold text-[clamp(1.25rem,2.5vw,1.75rem)] ${project.accent} leading-tight mb-1`}>
                  {metric.value}
                </div>
                <div className="font-mono text-[10px] md:text-xs uppercase tracking-widest text-zinc-500">
                  {metric.label}
                </div>
              </m.div>
            ))}
          </div>

          {/* Stack pills */}
          <div className="mb-16">
            <div className="font-mono text-xs uppercase tracking-widest text-zinc-500 mb-4">
              Stack
            </div>
            <div className="flex flex-wrap gap-2">
              {project.stack.map((tech) => (
                <span
                  key={tech}
                  className="border border-zinc-800 text-zinc-300 rounded-full px-4 py-1.5 text-xs font-mono"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Long-form content (memoised body stays referentially stable
              across parent state changes so scroll never triggers a re-parse) */}
          <div className="article-body prose prose-invert prose-zinc max-w-none prose-headings:font-display prose-headings:font-semibold prose-a:text-electric-lime hover:prose-a:text-electric-lime/80 prose-p:leading-[1.7] prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-zinc-100 prose-code:text-electric-lime prose-code:bg-zinc-900/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none prose-pre:bg-[#0a0a0a] prose-pre:border prose-pre:border-zinc-800/70 prose-pre:rounded-xl">
            <ProjectMarkdown content={projectContent} />
          </div>

          {/* Footer */}
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
                <div className="text-sm text-zinc-500">AI Researcher &amp; Systems Architect</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 sm:flex-none border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 rounded-full px-6 py-3 sm:py-2 text-xs uppercase tracking-widest font-mono transition-colors active:scale-[0.98]"
              >
                {isShared ? 'Link Copied' : 'Share'}
              </button>
              <Link
                to="/projects"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100 rounded-full px-6 py-3 sm:py-2 text-xs uppercase tracking-widest font-mono transition-colors active:scale-[0.98]"
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
            className="mt-20 pt-12 border-t border-zinc-800/50"
          >
            <div className="flex items-center gap-3 mb-8 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
              <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
              <h2 id="sibling-projects-heading">Other projects in the lab</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
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
                      className="group block h-full rounded-2xl border border-zinc-800/60 hover:border-electric-lime/50 transition-colors duration-500 overflow-hidden bg-[#050505]"
                    >
                      <div className="relative h-28 overflow-hidden bg-[#0a0a0a]">
                        <ProjectSignature slug={p.slug} />
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505] pointer-events-none" />
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`font-mono text-[10px] uppercase tracking-widest ${p.accent}`}>
                            {p.category}
                          </span>
                          <ArrowUpRight
                            size={14}
                            className="text-zinc-700 group-hover:text-electric-lime transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          />
                        </div>
                        <h3 className="font-display font-semibold text-lg text-zinc-100 leading-tight mb-1 group-hover:text-white transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 font-light">
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
