import { MessageCircle } from 'lucide-react';
import { m } from 'motion/react';

/**
 * Opens the lab guide chat panel. Sits bottom-right; coffee button is
 * top-right on desktop / also bottom-right on mobile - chat sits left of
 * coffee on mobile via bottom-6 right-20 so they don't stack.
 */
export default function FloatingChatButton() {
  const open = () => {
    window.dispatchEvent(new Event('open-lab-chat'));
  };

  return (
    <m.button
      type="button"
      onClick={open}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 1.5, ease: [0.32, 0.72, 0, 1] }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      aria-label="Open lab guide chat"
      title="Lab guide"
      className="fixed bottom-6 right-20 md:right-6 md:bottom-6 z-50 flex items-center justify-center size-11 rounded-full bg-zinc-950/90 border border-zinc-800 backdrop-blur-md bd-stable text-zinc-300 hover:text-electric-lime hover:border-electric-lime hover:shadow-[0_0_24px_rgba(202,255,74,0.25)] transition-[border-color,box-shadow,color] duration-300 group"
    >
      <MessageCircle size={18} strokeWidth={1.75} />
      <span
        aria-hidden
        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-zinc-950/95 border border-zinc-800 rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none bd-stable"
      >
        Lab guide
      </span>
    </m.button>
  );
}
