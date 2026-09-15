import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import VgpuInstrument from './VgpuInstrument';

/** Hero visual column: portrait + vgpu instrument + essays CTA. */
export default function HomeHeroAside() {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
      className="flex flex-col items-center md:items-start gap-6 md:ml-12"
    >
      <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-5">
        <img
          src="https://res.cloudinary.com/dpdttqyow/image/upload/f_auto,q_auto,w_400/v1768512786/Screenshot_2026-01-198_v3bwry.png"
          alt="Aditya Gaurav"
          className="w-48 md:w-64 h-auto object-contain"
          referrerPolicy="no-referrer"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width={400}
          height={400}
        />
        <VgpuInstrument />
      </div>
      <Link
        to="/articles"
        className="flex items-center justify-center gap-2 py-2 text-zinc-400 hover:text-electric-lime font-mono text-xs uppercase tracking-widest transition-colors active:scale-[0.98] w-48 md:w-64"
      >
        Start with the essays <ArrowUpRight size={14} />
      </Link>
    </m.div>
  );
}
