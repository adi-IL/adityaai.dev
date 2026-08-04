import { ArrowUpLeft } from 'lucide-react';

type BrandStampVariant = 'root' | 'sibling';

interface BrandStampProps {
  /**
   * 'root' renders an inert wordmark (for use inside adityaai.dev itself).
   * 'sibling' renders an anchor back to https://www.adityaai.dev, intended for
   *   friday/sentinel/opalserve subdomains. This component is the single
   *   source of truth for the cross-site lockup - mirror it into the three
   *   sibling repos byte-for-byte.
   */
  variant?: BrandStampVariant;
  /** 'dark' = for dark backgrounds (default). 'light' is reserved. */
  tone?: 'dark' | 'light';
  className?: string;
}

export default function BrandStamp({
  variant = 'root',
  tone = 'dark',
  className = '',
}: BrandStampProps) {
  const palette =
    tone === 'dark'
      ? 'text-zinc-500 hover:text-electric-lime border-zinc-800/60 hover:border-electric-lime/60 bg-zinc-950/60'
      : 'text-zinc-600 hover:text-zinc-900 border-zinc-300 hover:border-zinc-600 bg-white/60';

  const body = (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em]">
      {variant === 'sibling' && (
        <ArrowUpLeft size={11} strokeWidth={1.75} className="-ml-0.5" aria-hidden />
      )}
      <span>adityaai</span>
      <span className="opacity-50">·</span>
      <span className="opacity-70">lab</span>
    </span>
  );

  const shell = `inline-flex items-center rounded-full border backdrop-blur px-3 py-1.5 transition-colors duration-300 ${palette} ${className}`;

  if (variant === 'sibling') {
    return (
      <a
        href="https://www.adityaai.dev"
        className={shell}
        aria-label="Back to adityaai.dev"
      >
        {body}
      </a>
    );
  }

  return <span className={shell}>{body}</span>;
}
