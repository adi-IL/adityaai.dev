import { useEffect, useState, useRef, type FormEvent } from 'react';
import { m, AnimatePresence } from 'motion/react';
import { CheckCircle2, Coffee, X, XCircle } from 'lucide-react';

/**
 * Virtual Coffee lead-capture popup.
 *
 * Appears 25 seconds after mount on first visit (or after the 7-day
 * cooldown clears). Visitor introduces themselves, hits submit, and the
 * backend fires two Resend emails: a notification to Aditya with the
 * details, and a branded confirmation back to the visitor.
 *
 * Runs on both desktop AND mobile - no viewport-based skip. The only
 * route skipped is article detail pages, so a reader focused on the
 * content isn't interrupted mid-paragraph. Home, Projects, About, and
 * the articles listing all get the auto-popup.
 */

const STORAGE_KEY = 'adityaai:virtual-coffee';
const COOLDOWN_DAYS = 7;
const TRIGGER_MS = 25_000;

type Status = 'idle' | 'loading' | 'success' | 'error';

function isOnCooldown(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const stamped = parseInt(raw, 10);
    if (Number.isNaN(stamped)) return false;
    const ageMs = Date.now() - stamped;
    return ageMs < COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function stampCooldown() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* localStorage unavailable (private mode, etc) - popup just reappears next visit */
  }
}

function shouldSkipRoute(): boolean {
  // Don't interrupt readers mid-article. Everywhere else, the popup is fair.
  const path = window.location.pathname;
  return path.startsWith('/articles/') && path !== '/articles' && path !== '/articles/';
}

export default function VirtualCoffeePopup() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: '', message: '' });
  // Track whether the current open was auto-triggered or manual (floating button).
  // Only auto-triggered opens stamp the cooldown on dismiss - a manual click
  // means the visitor intentionally reached out and shouldn't block future
  // auto-popups from firing for new visitors / after cooldown expiry.
  const wasAutoTriggered = useRef(false);

  useEffect(() => {
    let timer: number | null = null;
    if (!isOnCooldown() && !shouldSkipRoute()) {
      timer = window.setTimeout(() => {
        wasAutoTriggered.current = true;
        setOpen(true);
      }, TRIGGER_MS);
    }
    const manualOpen = () => {
      wasAutoTriggered.current = false;
      setStatus('idle');
      setErrorMsg('');
      setForm({ name: '', email: '', role: '', message: '' });
      setOpen(true);
    };
    window.addEventListener('open-virtual-coffee', manualOpen);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      window.removeEventListener('open-virtual-coffee', manualOpen);
    };
  }, []);

  // Lock body scroll + allow Esc to close while the popup is open
  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function dismiss() {
    setOpen(false);
    if (wasAutoTriggered.current) stampCooldown();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    setStatus('loading');
    setErrorMsg('');
    try {
      const website =
        (document.getElementById('vc-website') as HTMLInputElement | null)?.value || '';
      const response = await fetch('/api/virtual-coffee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, website }),
      });
      const data = await response.json().catch(() => ({} as { error?: string }));
      if (response.ok) {
        setStatus('success');
        stampCooldown();
      } else {
        setStatus('error');
        setErrorMsg(
          typeof data.error === 'string' ? data.error : 'Something went wrong. Please try again.',
        );
      }
    } catch {
      setStatus('error');
      setErrorMsg('Failed to connect. Please try again in a moment.');
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="vc-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onClick={dismiss}
          className="fixed inset-0 z-[60] bg-zinc-950/80 backdrop-blur-sm flex items-center justify-center px-4 py-8"
          aria-modal="true"
          role="dialog"
          aria-labelledby="vc-title"
        >
          <m.div
            key="vc-panel"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md bg-[#0a0a0a] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/60 max-h-[90vh] overflow-y-auto"
          >
            <button
              type="button"
              onClick={dismiss}
              aria-label="Close virtual coffee popup"
              className="absolute top-4 right-4 text-zinc-600 hover:text-zinc-200 transition-colors p-1 z-10"
            >
              <X size={18} />
            </button>

            {status === 'success' ? (
              <div className="p-8 md:p-10 text-center">
                <div className="inline-flex items-center justify-center size-14 rounded-full bg-electric-lime/10 border border-electric-lime/30 mb-6">
                  <CheckCircle2 className="text-electric-lime" size={28} />
                </div>
                <h2 className="font-display font-semibold text-2xl text-zinc-50 mb-3 leading-tight">
                  Coffee's brewing.
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                  Got your note. I'll reply personally within 48 hours. Check your inbox for a quick confirmation.
                </p>
                <button
                  type="button"
                  onClick={dismiss}
                  className="border border-zinc-800 rounded-full px-6 py-2.5 text-zinc-400 hover:text-electric-lime hover:border-electric-lime font-mono text-xs uppercase tracking-widest transition-colors active:scale-[0.98]"
                >
                  Back to the lab
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-8 md:p-10">
                <div className="flex items-center gap-2 mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime">
                  <Coffee size={12} />
                  Virtual coffee
                </div>
                <h2
                  id="vc-title"
                  className="font-display font-semibold text-[clamp(1.5rem,3.5vw,1.875rem)] text-zinc-50 leading-tight mb-3"
                >
                  Let's grab a virtual coffee.
                </h2>
                <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                  Introduce yourself and what you're working on. I read every note personally and reply within 48 hours.
                </p>

                <div className="space-y-4">
                  <input
                    type="text"
                    id="vc-website"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                    className="absolute -left-[9999px] h-0 w-0 opacity-0"
                    defaultValue=""
                  />
                  <div>
                    <label
                      htmlFor="vc-name"
                      className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2"
                    >
                      Name
                    </label>
                    <input
                      id="vc-name"
                      type="text"
                      required
                      autoComplete="name"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      disabled={status === 'loading'}
                      className="w-full bg-transparent border-b border-zinc-800 px-1 py-2 text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 placeholder:text-zinc-700"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vc-email"
                      className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2"
                    >
                      Email
                    </label>
                    <input
                      id="vc-email"
                      type="email"
                      required
                      autoComplete="email"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                      disabled={status === 'loading'}
                      className="w-full bg-transparent border-b border-zinc-800 px-1 py-2 text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 placeholder:text-zinc-700"
                      placeholder="you@example.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vc-role"
                      className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2"
                    >
                      Role / Company <span className="text-zinc-700 normal-case tracking-normal">(optional)</span>
                    </label>
                    <input
                      id="vc-role"
                      type="text"
                      autoComplete="organization-title"
                      value={form.role}
                      onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                      disabled={status === 'loading'}
                      className="w-full bg-transparent border-b border-zinc-800 px-1 py-2 text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 placeholder:text-zinc-700"
                      placeholder="ML Engineer @ Acme"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="vc-message"
                      className="block font-mono text-[10px] uppercase tracking-widest text-zinc-500 mb-2"
                    >
                      What you'd like to chat about <span className="text-zinc-700 normal-case tracking-normal">(optional)</span>
                    </label>
                    <textarea
                      id="vc-message"
                      rows={3}
                      value={form.message}
                      onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                      disabled={status === 'loading'}
                      className="w-full bg-transparent border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 placeholder:text-zinc-700 text-sm leading-relaxed resize-none"
                      placeholder="A system you're stuck on, a paper you want to discuss, a collaboration idea..."
                    />
                  </div>
                </div>

                <div className="mt-7 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={status === 'loading' || !form.name.trim() || !form.email.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-2 bg-electric-lime text-zinc-950 hover:bg-electric-lime/90 rounded-full px-6 py-3 text-xs uppercase tracking-widest font-mono font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-electric-lime"
                  >
                    {status === 'loading' ? (
                      <span className="inline-block size-4 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" />
                    ) : (
                      <>
                        <Coffee size={14} />
                        Send invite
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={dismiss}
                    className="text-zinc-500 hover:text-zinc-300 text-xs uppercase tracking-widest font-mono transition-colors p-3"
                  >
                    Not now
                  </button>
                </div>

                {status === 'error' && errorMsg && (
                  <m.p
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 text-red-400 flex items-center gap-2 text-xs"
                  >
                    <XCircle size={14} />
                    {errorMsg}
                  </m.p>
                )}
              </form>
            )}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
