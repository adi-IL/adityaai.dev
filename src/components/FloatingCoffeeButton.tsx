import { Coffee } from 'lucide-react';
import { m } from 'motion/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui-sdk/react/tooltip';

/**
 * Persistent liquid glass orb for the Virtual Coffee lead-capture dialog.
 */
export default function FloatingCoffeeButton() {
  const open = () => {
    window.dispatchEvent(new Event('open-virtual-coffee'));
  };

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <m.button
            type="button"
            onClick={open}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.8, ease: [0.32, 0.72, 0, 1] }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Open virtual coffee form"
            className="fixed bottom-6 right-6 md:bottom-auto md:top-6 z-50 flex items-center justify-center size-12 rounded-full liquid-orb bd-stable text-electric-lime transition-[border-color,box-shadow] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime"
          />
        }
      >
        <Coffee size={18} strokeWidth={1.75} />
        <span
          aria-hidden
          className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)]"
        >
          <span className="absolute inset-0 rounded-full bg-electric-lime motion-safe:animate-ping opacity-60" />
        </span>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        sideOffset={12}
        className="liquid-glass rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-200 transition-[opacity,transform] duration-150 data-starting-style:opacity-0 data-starting-style:translate-x-1 data-ending-style:opacity-0 data-ending-style:translate-x-1"
      >
        Virtual coffee
      </TooltipContent>
    </Tooltip>
  );
}
