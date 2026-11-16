import { useState, useRef } from 'react';
import { m } from 'motion/react';
import { ArrowUpRight, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Project } from '../lib/projects';
import ProjectSignature from './ProjectSignature';

export default function HomeProjectCard({ project, index }: { project: Project; index: number }) {
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
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.32, 0.72, 0, 1] }}
      className="h-full"
    >
      <Link
        ref={divRef}
        to={`/projects/${project.slug}`}
        onMouseMove={handleMouseMove}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group flex flex-col justify-between h-full relative rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] hover:border-electric-lime/50 transition-all duration-300 overflow-hidden"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 z-20 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent"
        />
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-10"
          style={{
            opacity,
            background: `radial-gradient(500px circle at ${position.x}px ${position.y}px, rgba(202,255,74,.05), transparent 40%)`,
          }}
        />
        <div>
          <div className="relative h-40 overflow-hidden bg-[#070707] border-b border-zinc-800/60">
            <ProjectSignature slug={project.slug} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0a0a] pointer-events-none" />
          </div>

          <div className="p-6 pb-4 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-electric-lime">
                  {project.category}
                </span>
                {project.award && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-300">
                    <Trophy size={10} /> Winner
                  </span>
                )}
              </div>
              <ArrowUpRight
                size={16}
                className="text-zinc-600 group-hover:text-electric-lime transition-all duration-300 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>

            <h3 className="font-display font-semibold text-2xl text-zinc-100 mb-1.5 leading-tight group-hover:text-white transition-colors">
              {project.name}
            </h3>
            <p className={`font-display font-medium text-sm leading-snug ${project.accent} mb-3`}>
              {project.tagline}
            </p>
            <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2 font-light">
              {project.excerpt}
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 pt-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-800/80 bg-zinc-800/60">
            {project.metrics.slice(0, 2).map((mItem) => (
              <div key={mItem.label} className="bg-zinc-950/90 px-3 py-2">
                <div className="font-mono text-[9px] uppercase tracking-wider text-zinc-500">
                  {mItem.label}
                </div>
                <div className={`mt-0.5 font-mono text-xs font-semibold tabular-nums ${project.accent}`}>
                  {mItem.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Link>
    </m.div>
  );
}
