import { Coffee } from 'lucide-react';
import { m } from 'motion/react';

/**
 * Persistent floating coffee button. Sits top-right, parallel to the
 * centered navbar on desktop - close enough that it reads as part of the
 * nav family, far enough that it never touches or competes visually.
 *
 * Hidden on mobile because the hamburger sits at the same `top-6 right-6`
 * corner; mobile visitors still get the auto-popup + the in-menu links.
 *
 * Dispatches a global `open-virtual-coffee` event on click, which the
 * VirtualCoffeePopup listens for and opens immediately (bypassing the
 * 7-day auto-popup cooldown, because an intentional click = clear intent).
 */
export default function FloatingCoffeeButton() {
  const open = () => {
    window.dispatchEvent(new Event('open-virtual-coffee'));
  };

  return (
    <m.button
      type="button"
      onClick={open}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 1.8, ease: [0.32, 0.72, 0, 1] }}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      aria-label="Open virtual coffee form"
      title="Virtual coffee"
      className="fixed bottom-6 right-6 md:bottom-auto md:top-6 z-50 flex items-center justify-center size-11 rounded-full bg-zinc-950/90 border border-zinc-800 backdrop-blur-md bd-stable text-electric-lime hover:border-electric-lime hover:shadow-[0_0_24px_rgba(202,255,74,0.3)] transition-[border-color,box-shadow] duration-300 group"
    >
      <Coffee size={18} strokeWidth={1.75} />

      {/* Pulse dot: signals "this is live, you can reach me here" without
          being loud. Pairs with the hero's electric-lime rhythm. */}
      <span
        aria-hidden
        className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)]"
      >
        <span className="absolute inset-0 rounded-full bg-electric-lime animate-ping opacity-60" />
      </span>

      {/* Left-side tooltip slides in on hover. Uses the same smoke-grey +
          black palette as the navbar pill so the button feels like a
          family member, not an afterthought widget. */}
      <span
        aria-hidden
        className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-zinc-950/95 border border-zinc-800 rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-300 whitespace-nowrap opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300 pointer-events-none bd-stable"
      >
        Virtual coffee
      </span>
    </m.button>
  );
}
