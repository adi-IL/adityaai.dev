import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import SEO from '../components/SEO';

export default function NotFound() {
  return (
    <div className="min-h-screen pt-40 pb-24 flex flex-col items-center justify-center text-center px-6">
      <SEO
        title="404 - Page Not Found | Aditya Gaurav"
        description="The page you're looking for doesn't exist or has been moved."
        noIndex
      />
      <div className="relative max-w-lg w-full overflow-hidden rounded-3xl border border-zinc-800/80 bg-[#0a0a0a] p-10 md:p-14">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent"
        />
        <div className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime mb-4">
          <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)]" />
          Route status · unmapped path
        </div>
        <h1 className="font-sans font-semibold text-[clamp(4rem,10vw,6.5rem)] leading-none tracking-tight text-zinc-50 mb-4">
          404
        </h1>
        <p className="text-zinc-400 text-base md:text-lg mb-8 font-light leading-relaxed">
          This route does not exist on the lab surface or has been moved.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full bg-electric-lime px-5 py-2.5 text-zinc-950 hover:bg-electric-lime/90 font-mono text-xs font-semibold uppercase tracking-widest transition-colors"
          >
            <ArrowLeft size={14} />
            Back home
          </Link>
          <Link
            to="/articles"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950 px-5 py-2.5 text-zinc-300 hover:text-electric-lime hover:border-electric-lime font-mono text-xs uppercase tracking-widest transition-colors"
          >
            Essays <ArrowUpRight size={13} />
          </Link>
          <Link
            to="/projects"
            className="inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950 px-5 py-2.5 text-zinc-300 hover:text-electric-lime hover:border-electric-lime font-mono text-xs uppercase tracking-widest transition-colors"
          >
            Projects <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
