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
        className="mt-16 rounded-2xl border border-zinc-800/60 bg-zinc-950/50 px-6 py-8 text-center"
        aria-label="Feedback submitted"
      >
        <CheckCircle2 className="text-electric-lime mx-auto mb-3" size={28} />
        <p className="text-zinc-300 text-sm">Thanks for the feedback. It means a lot.</p>
      </m.section>
    );
  }

  return (
    <section
      aria-label="Article feedback"
      className="mt-16 rounded-2xl border border-zinc-800/60 bg-zinc-950/50 px-6 py-8 md:px-10 md:py-10"
    >
      <div className="flex items-center gap-3 mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime">
        <span className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)]" />
        Feedback
      </div>
      <h3 className="font-display font-medium text-lg md:text-xl text-zinc-100 mb-2 leading-tight">
        How did you find this article?
      </h3>
      <p className="text-zinc-500 text-sm mb-6">Pick a reaction. Optionally add a note.</p>

      {/* Reaction buttons */}
      <div className="flex flex-wrap gap-3 mb-5">
        {REACTIONS.map((r) => (
          <button
            key={r.key}
            type="button"
            onClick={() => setReaction(reaction === r.key ? null : r.key)}
            className={`inline-flex items-center gap-2 border rounded-full px-4 py-2 text-xs font-mono uppercase tracking-widest transition-all duration-300 active:scale-[0.96] ${
              reaction === r.key
                ? 'bg-electric-lime/10 border-electric-lime text-electric-lime'
                : 'border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
            }`}
          >
            <span className="text-base">{r.emoji}</span>
            {r.label}
          </button>
        ))}
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
            <div className="space-y-4 pt-2 pb-1">
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
                  className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2"
                >
                  Want to share more? <span className="text-zinc-700 normal-case tracking-normal">(optional)</span>
                </label>
                <textarea
                  id="fb-comment"
                  rows={2}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  disabled={status === 'loading'}
                  className="w-full bg-transparent border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 placeholder:text-zinc-700 text-sm leading-relaxed resize-none"
                  placeholder="What specifically helped? What was missing?"
                />
              </div>
              <div>
                <label
                  htmlFor="fb-email"
                  className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2"
                >
                  Your email <span className="text-zinc-700 normal-case tracking-normal">(if you'd like a reply)</span>
                </label>
                <input
                  id="fb-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={status === 'loading'}
                  className="w-full bg-transparent border-b border-zinc-800 px-1 py-2 text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 placeholder:text-zinc-700"
                  placeholder="you@example.com"
                />
              </div>
              <button
                type="button"
                onClick={submit}
                disabled={status === 'loading'}
                className="inline-flex items-center justify-center gap-2 border border-zinc-800 rounded-full px-6 py-2.5 text-zinc-400 hover:text-electric-lime hover:border-electric-lime font-mono text-xs uppercase tracking-widest transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                {status === 'loading' ? (
                  <span className="inline-block size-4 border-2 border-zinc-700 border-t-electric-lime rounded-full animate-spin" />
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
