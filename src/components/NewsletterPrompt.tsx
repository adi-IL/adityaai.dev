import { useState, type FormEvent } from 'react';
import { m } from 'motion/react';
import { CheckCircle2, XCircle } from 'lucide-react';

/**
 * Compact inline newsletter prompt for end-of-article / end-of-project
 * placements. Shares the `/api/subscribe` endpoint with the home page
 * form; the visual treatment is lighter to fit inside a content flow.
 *
 * Props let callers tune the headline + subhead per surface so the copy
 * can match the context (e.g. "Get the next one in your inbox" on an
 * article vs "Watch the next launch" on a project page).
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
    } catch (err) {
      setStatus('error');
      setErrorMessage('Failed to connect to the server. Please try again later.');
    }
  };

  return (
    <aside
      aria-label="Newsletter signup"
      className="mt-20 rounded-2xl border border-zinc-800/60 bg-zinc-950/50 px-6 py-8 md:px-10 md:py-10"
    >
      <div className="flex items-center gap-3 mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime">
        <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(204,255,0,0.8)] animate-pulse" />
        Newsletter
      </div>
      <h3 className="font-display font-medium text-xl md:text-2xl text-zinc-100 mb-3 leading-tight">
        {headline}
      </h3>
      <p className="text-zinc-500 text-sm md:text-base font-light leading-relaxed mb-6 max-w-xl">
        {subhead}
      </p>
      <form
        className="relative flex flex-col sm:flex-row gap-3 max-w-xl"
        onSubmit={handleSubmit}
      >
        <label htmlFor="inline-newsletter-email" className="sr-only">
          Email address
        </label>
        {/* Honeypot — leave empty. Hidden from assistive tech and sighted users. */}
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
          className="flex-1 bg-transparent border-b border-zinc-800 px-3 py-2.5 text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 font-light placeholder:text-zinc-700"
          required
        />
        <button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="border border-zinc-800 rounded-full px-5 py-2.5 text-zinc-400 hover:text-electric-lime hover:border-electric-lime font-mono text-xs uppercase tracking-widest transition-colors active:scale-[0.98] disabled:opacity-50 disabled:hover:text-zinc-400 disabled:hover:border-zinc-800 min-w-[120px] flex items-center justify-center"
        >
          {status === 'loading' ? (
            <div className="size-4 border border-zinc-700 border-t-electric-lime rounded-full animate-spin" />
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
