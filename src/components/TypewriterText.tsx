import { useState, useEffect } from 'react';
import { m } from 'motion/react';

export default function TypewriterText({ text, delay = 0 }: { text: string, delay?: number }) {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    let rafId = 0;
    let startTime = 0;
    const charDuration = 70;

    const tick = (now: number) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const nextIndex = Math.min(text.length, Math.floor(elapsed / charDuration));
      setDisplayText(text.slice(0, nextIndex));
      if (nextIndex < text.length) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const startId = window.setTimeout(() => {
      rafId = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(startId);
      cancelAnimationFrame(rafId);
    };
  }, [text, delay]);

  return (
    <div className="mb-6 min-h-[3rem] md:min-h-[3rem] leading-normal text-xl md:text-3xl">
      <span className="font-mono font-semibold uppercase tracking-widest text-zinc-200 break-words">
        {displayText}
      </span>
      <m.span
        animate={{ opacity: [1, 1, 0, 0] }}
        transition={{ repeat: Infinity, duration: 0.8, times: [0, 0.5, 0.5, 1] }}
        className="inline-block w-[0.4em] h-[0.75em] bg-electric-lime ml-2 align-baseline"
      />
    </div>
  );
}
