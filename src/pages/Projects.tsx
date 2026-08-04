import { m } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, ExternalLink, Github } from 'lucide-react';
import { projects, Project } from '../lib/projects';
import SEO from '../components/SEO';
import ProjectSignature from '../components/ProjectSignature';

export default function Projects() {
  return (
    <div className="min-h-screen pt-32 pb-16">
      <SEO
        title="Projects | Aditya Gaurav - AI Engineer & Systems Architect"
        description="Shipping AI products: MCP registry (OpalServe), 3D engineering engine (FRIDAY), competitive intelligence (Sentinel), Excel graph (Ohh-my-excel), and more."
        canonicalUrl="https://www.adityaai.dev/projects"
        breadcrumbs={[
          { name: 'Home', url: 'https://www.adityaai.dev/' },
          { name: 'Projects', url: 'https://www.adityaai.dev/projects' },
        ]}
      />

      <section className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12 py-20">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          className="mb-16 border-b border-zinc-800/50 pb-8"
        >
          <h1 className="font-display font-semibold text-[clamp(2.5rem,8vw,4rem)] leading-[1.1] tracking-[-0.02em] text-zinc-50 mb-4">
            Projects
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed">
            Shipped products and platforms. Each one built end-to-end: architecture, code,
            deployment, docs. Click any card for the full engineering write-up.
          </p>
        </m.div>

        <div className="grid grid-cols-1 gap-6 md:gap-8">
          {projects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} />
          ))}
        </div>
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
      <Link
        to={`/projects/${project.slug}`}
        className="block group relative rounded-3xl overflow-hidden border border-zinc-800/60 hover:border-zinc-600 transition-colors duration-500"
      >
        <div className="absolute inset-0 bg-zinc-900/0 group-hover:bg-zinc-900/30 transition-colors duration-500 -z-10" />

        <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1fr]">
          {/* Text side */}
          <div className="p-8 md:p-12 flex flex-col justify-between min-h-[360px]">
            <div>
              <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest mb-6">
                <span className="text-electric-lime">{project.category}</span>
                <span className="text-zinc-700">•</span>
                <span className="text-zinc-500">{project.year}</span>
                <span className="text-zinc-700">•</span>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
                  {project.status}
                </span>
              </div>

              <h2 className="font-display font-semibold text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-[-0.02em] text-zinc-50 group-hover:text-white transition-colors mb-3">
                {project.name}
              </h2>

              <p className={`font-display font-medium text-base md:text-lg leading-tight ${project.accent} mb-5`}>
                {project.tagline}
              </p>

              <p className="text-zinc-400 text-sm md:text-base leading-relaxed line-clamp-3">
                {project.excerpt}
              </p>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div className="flex flex-wrap gap-2">
                {project.stack.slice(0, 4).map((tech) => (
                  <span
                    key={tech}
                    className="border border-zinc-800 text-zinc-400 rounded-full px-3 py-1 text-[10px] font-mono"
                  >
                    {tech}
                  </span>
                ))}
                {project.stack.length > 4 && (
                  <span className="text-zinc-600 text-[10px] font-mono self-center">
                    +{project.stack.length - 4}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Visual side */}
          <div className="relative bg-[#0a0a0a] border-t md:border-t-0 md:border-l border-zinc-800/50 overflow-hidden">
            <ProjectSignature slug={project.slug} />
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/40 pointer-events-none" />

            <div className="relative z-10 h-full min-h-[220px] md:min-h-[360px] flex flex-col justify-between p-6 md:p-8 pointer-events-none">
              <div className="flex justify-end">
                <div className="bg-zinc-950/80 backdrop-blur border border-zinc-800/60 rounded-full p-2.5 group-hover:border-electric-lime transition-colors pointer-events-auto">
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
      </Link>
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
      className="inline-flex items-center gap-1.5 bg-zinc-950/80 backdrop-blur border border-zinc-800/60 hover:border-electric-lime hover:text-electric-lime rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-300 transition-colors"
    >
      {icon}
      {children}
    </a>
  );
}
