import { m } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Project } from '../lib/projects';
import ProjectSignature from './ProjectSignature';

export default function HomeProjectCard({ project, index }: { project: Project; index: number }) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.32, 0.72, 0, 1] }}
    >
      <Link
        to={`/projects/${project.slug}`}
        className="group block h-full relative rounded-2xl border border-zinc-800/60 hover:border-zinc-600 transition-colors duration-500 overflow-hidden"
      >
        <div className="relative h-36 overflow-hidden bg-[#0a0a0a]">
          <ProjectSignature slug={project.slug} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#050505] pointer-events-none" />
        </div>

        <div className="p-6 bg-[#050505] relative">
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[10px] uppercase tracking-widest text-electric-lime">
              {project.category}
            </span>
            <ArrowUpRight
              size={16}
              className="text-zinc-700 group-hover:text-electric-lime transition-all duration-300 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            />
          </div>

          <h3 className="font-display font-semibold text-xl text-zinc-100 mb-2 leading-tight group-hover:text-white transition-colors">
            {project.name}
          </h3>
          <p className={`font-display font-medium text-sm leading-snug ${project.accent} mb-3`}>
            {project.tagline}
          </p>
          <p className="text-zinc-500 text-xs leading-relaxed line-clamp-2 font-light">
            {project.excerpt}
          </p>
        </div>
      </Link>
    </m.div>
  );
}
