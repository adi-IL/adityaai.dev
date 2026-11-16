import { MessageCircle } from 'lucide-react';
import { m } from 'motion/react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui-sdk/react/tooltip';

/**
 * Liquid glass orb that opens the lab guide chat panel.
 */
export default function FloatingChatButton() {
  const open = () => {
    window.dispatchEvent(new Event('open-lab-chat'));
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
            transition={{ duration: 0.5, delay: 1.5, ease: [0.32, 0.72, 0, 1] }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            aria-label="Open lab guide chat"
            className="fixed bottom-6 right-20 md:right-6 md:bottom-6 z-50 flex items-center justify-center size-12 rounded-full liquid-orb bd-stable text-zinc-200 hover:text-electric-lime transition-[border-color,box-shadow,color] duration-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime"
          />
        }
      >
        <MessageCircle size={18} strokeWidth={1.75} />
      </TooltipTrigger>
      <TooltipContent
        side="left"
        sideOffset={12}
        className="liquid-glass rounded-full px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-zinc-200 transition-[opacity,transform] duration-150 data-starting-style:opacity-0 data-starting-style:translate-x-1 data-ending-style:opacity-0 data-ending-style:translate-x-1"
      >
        Lab guide
      </TooltipContent>
    </Tooltip>
  );
}
