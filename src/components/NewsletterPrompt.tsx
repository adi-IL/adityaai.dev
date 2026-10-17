import { useState, type FormEvent } from 'react';
import { m } from 'motion/react';
import { CheckCircle2, XCircle } from 'lucide-react';

/**
 * Compact inline newsletter prompt for end-of-article / end-of-project
 * placements. Shares the `/api/subscribe` endpoint with the home page
 * form; the visual treatment matches the #0a0a0a observatory cards.
 */
export default function NewsletterPrompt({
  headline = 'Get the next one in your inbox.',
  subhead = 'Infrequent, high-signal essays on AI architecture and systems design. No spam, unsubscribe any time.',
}: {
  headline?: string;
  subhead?: string;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const form = e.currentTarget;
      const website = (form.elements.namedItem('website') as HTMLInputElement | null)?.value || '';
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website }),
      });
      const data = await response.json().catch(() => ({} as { error?: string }));
      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        setStatus('error');
        setErrorMessage(
          typeof data.error === 'string' ? data.error : 'Something went wrong. Please try again.',
        );
      }
    } catch {
      setStatus('error');
      setErrorMessage('Failed to connect to the server. Please try again later.');
    }
  };

  return (
    <aside
      aria-label="Newsletter signup"
      className="relative mt-12 overflow-hidden rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] px-6 py-8 md:px-10 md:py-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent"
      />
      <div className="flex items-center gap-2.5 mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime">
        <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)] animate-pulse" />
        Newsletter · dispatches
      </div>
      <h3 className="font-display font-semibold text-xl md:text-2xl text-zinc-100 mb-2 leading-tight">
        {headline}
      </h3>
      <p className="text-zinc-400 text-sm md:text-base font-light leading-relaxed mb-6 max-w-xl">
        {subhead}
      </p>
      <form
        className="relative flex flex-col sm:flex-row gap-3 max-w-xl"
        onSubmit={handleSubmit}
      >
        <label htmlFor="inline-newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 opacity-0"
          defaultValue=""
        />
        <input
          type="email"
          id="inline-newsletter-email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === 'loading' || status === 'success'}
          placeholder="you@example.com"
          className="flex-1 rounded-full border border-zinc-800 bg-zinc-950 px-5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 font-mono placeholder:text-zinc-600"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="rounded-full bg-electric-lime px-6 py-2.5 text-zinc-950 hover:bg-electric-lime/90 font-mono text-xs font-semibold uppercase tracking-widest transition-colors active:scale-[0.98] disabled:opacity-50 min-w-[130px] flex items-center justify-center"
        >
          {status === 'loading' ? (
            <div className="size-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          ) : status === 'success' ? (
            'Subscribed'
          ) : (
            'Subscribe'
          )}
        </button>
      </form>

      {status === 'success' && (
        <m.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-electric-lime mt-4 flex items-center gap-2 text-sm"
        >
          <CheckCircle2 size={16} />
          Check your inbox and confirm the link to finish subscribing.
        </m.p>
      )}
      {status === 'error' && (
        <m.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 mt-4 flex items-center gap-2 text-sm"
        >
          <XCircle size={16} />
          {errorMessage}
        </m.p>
      )}
    </aside>
  );
}
