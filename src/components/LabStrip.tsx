import { ArrowUpRight } from 'lucide-react';
import { projects } from '../lib/projects';

/**
 * "Part of the adityaai.dev lab" footer ribbon. Renders the three sibling
 * projects as compact cards. On adityaai.dev these link into the project
 * detail route; when ported to friday/sentinel/opalserve they should link
 * to the external subdomain (pass `externalLinks` on those forks).
 */
export default function LabStrip({
  externalLinks = false,
  currentSlug,
}: {
  externalLinks?: boolean;
  currentSlug?: string;
}) {
  return (
    <div className="border-t border-zinc-800/50 py-10">
      <div className="max-w-6xl mx-auto px-6 md:px-8 lg:px-12">
        <div className="flex items-center gap-3 mb-6 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)]" />
          Part of the adityaai.dev lab
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {projects.map((p) => {
            const isCurrent = p.slug === currentSlug;
            const href = externalLinks ? p.liveUrl : `/projects/${p.slug}`;
            const external = externalLinks;
            const labelExtras = external ? { target: '_blank', rel: 'noopener noreferrer' } : {};
            return (
              <a
                key={p.slug}
                href={href}
                {...labelExtras}
                aria-current={isCurrent ? 'page' : undefined}
                className={`group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition-colors duration-300 ${
                  isCurrent
                    ? 'border-electric-lime/30 bg-electric-lime/5'
                    : 'border-zinc-800/60 hover:border-zinc-600'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-1">
                    <span className={p.accent}>{p.category}</span>
                    {isCurrent && <span className="text-electric-lime">current</span>}
                  </div>
                  <div className="font-display font-medium text-zinc-100 text-sm truncate group-hover:text-white transition-colors">
                    {p.name}
                  </div>
                  <div className="text-zinc-500 text-xs truncate font-light">{p.tagline}</div>
                </div>
                <ArrowUpRight
                  size={14}
                  className="flex-shrink-0 text-zinc-700 group-hover:text-electric-lime group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all"
                />
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
