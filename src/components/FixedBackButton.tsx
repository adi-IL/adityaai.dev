import { m, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useScrolledPast } from '../hooks/useScrolledPast';

/**
 * Self-contained "back" pill that appears once the user has scrolled past
 * `threshold` pixels. Owns its own scroll-reactive state so the page-level
 * component (ArticleDetail, ProjectDetail) does not re-render when the
 * visibility flag flips.
 *
 * Why this matters: putting `useScrolledPast` inside ArticleDetail used to
 * re-render the whole article on every 200 px crossing, which re-parsed the
 * full markdown tree and produced the "scroll got stuck for a beat" feeling
 * on long research pieces. Isolating the state here lets the heavy content
 * stay completely stable during scroll.
 */
export default function FixedBackButton({
  to,
  label = 'Back',
  threshold = 200,
}: {
  to: string;
  label?: string;
  threshold?: number;
}) {
  const isScrolled = useScrolledPast(threshold);

  return (
    <AnimatePresence>
      {isScrolled && (
        <m.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="fixed top-6 left-4 md:left-6 z-50"
        >
          <Link
            to={to}
            className="flex items-center gap-2 bg-zinc-950/60 backdrop-blur-md bd-stable border border-zinc-800/40 rounded-full px-4 py-2 text-zinc-500 hover:text-zinc-300 transition-colors text-xs uppercase tracking-widest font-mono shadow-2xl shadow-black/50"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        </m.div>
      )}
    </AnimatePresence>
  );
}
