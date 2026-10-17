import { useState } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle } from 'lucide-react';

const REACTIONS = [
  { key: 'insightful', emoji: '🔥', label: 'Insightful' },
  { key: 'useful', emoji: '💡', label: 'Useful' },
  { key: 'needs-depth', emoji: '🤔', label: 'Needs more depth' },
] as const;

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ArticleFeedback({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [reaction, setReaction] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function submit() {
    if (!reaction) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const website =
        (document.getElementById('fb-website') as HTMLInputElement | null)?.value || '';
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title, reaction, comment, email, website }),
      });
      const data = await res.json().catch(() => ({} as { error?: string }));
      if (res.ok) {
        setStatus('success');
      } else {
        setStatus('error');
        setErrorMsg(typeof data.error === 'string' ? data.error : 'Something went wrong.');
      }
    } catch {
      setStatus('error');
      setErrorMsg('Failed to connect. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <m.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-12 rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] px-6 py-8 text-center"
        aria-label="Feedback submitted"
      >
        <CheckCircle2 className="text-electric-lime mx-auto mb-3" size={28} />
        <p className="text-zinc-200 text-sm font-medium">Thanks for the feedback. It means a lot.</p>
      </m.section>
    );
  }

  return (
    <section
      aria-label="Article feedback"
      className="relative mt-12 overflow-hidden rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] px-6 py-8 md:px-10 md:py-10"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent"
      />
      <div className="flex items-center gap-2.5 mb-3 font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime">
        <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)]" />
        Reader signal
      </div>
      <h3 className="font-display font-semibold text-xl md:text-2xl text-zinc-100 mb-2 leading-tight">
        How did you find this essay?
      </h3>
      <p className="text-zinc-400 text-sm mb-6 font-light">Pick a reaction. Optionally add a note.</p>

      {/* Reaction buttons */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        {REACTIONS.map((r) => {
          const active = reaction === r.key;
          return (
            <button
              key={r.key}
              type="button"
              aria-pressed={active}
              onClick={() => setReaction(active ? null : r.key)}
              className={`inline-flex items-center gap-2 border rounded-full px-4 py-2 text-xs font-mono uppercase tracking-widest transition-all duration-200 active:scale-[0.97] ${
                active
                  ? 'bg-electric-lime text-zinc-950 border-electric-lime font-semibold shadow-[0_0_20px_rgba(202,255,74,0.2)]'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-600 hover:text-zinc-100'
              }`}
            >
              <span className="text-base">{r.emoji}</span>
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Expandable details area */}
      <AnimatePresence>
        {reaction && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-3 pb-1 border-t border-zinc-900">
              <input
                type="text"
                id="fb-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] h-0 w-0 opacity-0"
                defaultValue=""
              />
              <div>
                <label
                  htmlFor="fb-comment"
                  className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2"
                >
                  Want to share more? <span className="text-zinc-600 normal-case tracking-normal">(optional)</span>
                </label>
                <textarea
                  id="fb-comment"
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={status === 'loading'}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 placeholder:text-zinc-600 text-sm leading-relaxed resize-none"
                  placeholder="What specifically helped? What was missing?"
                />
              </div>
              <div>
                <label
                  htmlFor="fb-email"
                  className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2"
                >
                  Your email <span className="text-zinc-600 normal-case tracking-normal">(if you'd like a reply)</span>
                </label>
                <input
                  id="fb-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 placeholder:text-zinc-600 font-mono"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={status === 'loading'}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-electric-lime px-6 py-2.5 text-zinc-950 hover:bg-electric-lime/90 font-mono text-xs font-semibold uppercase tracking-widest transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <span className="inline-block size-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Send feedback'
                )}
              </button>
              {status === 'error' && errorMsg && (
                <m.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-red-400 flex items-center gap-2 text-xs"
                >
                  <XCircle size={14} />
                  {errorMsg}
                </m.p>
              )}
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </section>
  );
}
