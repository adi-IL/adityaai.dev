import { useEffect, useState, useRef, type FormEvent } from 'react';
import { m } from 'motion/react';
import { CheckCircle2, Coffee, X, XCircle } from 'lucide-react';
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@ui-sdk/react/dialog';
import { Field, FieldLabel } from '@ui-sdk/react/field';
import { Input } from '@ui-sdk/react/input';
import { Textarea } from '@ui-sdk/react/textarea';
import { toast } from '@ui-sdk/react/toast';

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
    return Date.now() - stamped < COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function stampCooldown() {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

function shouldSkipRoute(): boolean {
  const path = window.location.pathname;
  return (
    path === '/' ||
    (path.startsWith('/articles/') && path !== '/articles' && path !== '/articles/')
  );
}

export default function VirtualCoffeePopup() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', role: '', message: '' });
  // Only auto-triggered opens stamp the cooldown on dismiss so manual clicks stay repeatable.
  const wasAutoTriggered = useRef(false);

  useEffect(() => {
    let timer: number | null = null;
    if (!isOnCooldown() && !shouldSkipRoute()) {
      timer = window.setTimeout(() => {
        if (shouldSkipRoute()) return;
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

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen && wasAutoTriggered.current) {
      stampCooldown();
    }
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
        toast.success('Virtual coffee request sent', {
          description: 'Confirmation email is on its way.',
        });
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
    <Dialog open={open} onOpenChange={handleOpenChange} presentation="auto">
      <DialogBackdrop className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0" />
      <DialogContent
        className="fixed left-1/2 top-1/2 z-[61] w-[min(100vw-2rem,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-2xl liquid-glass-panel max-h-[90vh] overflow-y-auto transition-[opacity,transform] duration-200 data-starting-style:opacity-0 data-starting-style:scale-96 data-ending-style:opacity-0 data-ending-style:scale-96 data-[presentation=sheet]:bottom-auto data-[presentation=sheet]:left-0 data-[presentation=sheet]:right-0 data-[presentation=sheet]:w-full data-[presentation=sheet]:translate-x-0 data-[presentation=sheet]:translate-y-0 data-[presentation=sheet]:rounded-b-none"
      >
        <DialogClose
          aria-label="Close virtual coffee popup"
          className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200 transition-colors p-1.5 rounded-full hover:bg-white/[0.06] z-10"
        >
          <X size={18} />
        </DialogClose>

        {status === 'success' ? (
          <div className="p-8 md:p-10 text-center">
            <div className="inline-flex items-center justify-center size-14 rounded-full bg-electric-lime/10 border border-electric-lime/30 mb-6">
              <CheckCircle2 className="text-electric-lime" size={28} />
            </div>
            <DialogTitle className="font-display font-semibold text-2xl text-zinc-50 mb-3 leading-tight">
              Coffee's brewing.
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm leading-relaxed mb-6">
              Got your note. I'll reply personally within 48 hours. Check your inbox for a quick confirmation.
            </DialogDescription>
            <DialogClose className="border border-white/10 rounded-full px-6 py-2.5 text-zinc-300 hover:text-electric-lime hover:border-electric-lime font-mono text-xs uppercase tracking-widest transition-colors active:scale-[0.98]">
              Back to the lab
            </DialogClose>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 md:p-10">
            <div className="flex items-center gap-2 mb-4 font-mono text-[10px] uppercase tracking-[0.22em] text-electric-lime">
              <Coffee size={12} />
              Virtual coffee
            </div>
            <DialogTitle className="font-display font-semibold text-[clamp(1.5rem,3.5vw,1.875rem)] text-zinc-50 leading-tight mb-3">
              Let's grab a virtual coffee.
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-sm leading-relaxed mb-6">
              Introduce yourself and what you're working on. I read every note personally and reply within 48 hours.
            </DialogDescription>

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

              <Field>
                <FieldLabel className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
                  Name
                </FieldLabel>
                <Input
                  type="text"
                  required
                  autoComplete="name"
                  value={form.name}
                  onValueChange={(value) => setForm((f) => ({ ...f, name: value }))}
                  disabled={status === 'loading'}
                  className="w-full bg-transparent border-b border-white/10 px-1 py-2 text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 placeholder:text-zinc-600"
                  placeholder="Your name"
                />
              </Field>

              <Field>
                <FieldLabel className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
                  Email
                </FieldLabel>
                <Input
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onValueChange={(value) => setForm((f) => ({ ...f, email: value }))}
                  disabled={status === 'loading'}
                  className="w-full bg-transparent border-b border-white/10 px-1 py-2 text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 placeholder:text-zinc-600"
                  placeholder="you@example.com"
                />
              </Field>

              <Field>
                <FieldLabel className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
                  Role / Company <span className="text-zinc-600 normal-case tracking-normal">(optional)</span>
                </FieldLabel>
                <Input
                  type="text"
                  autoComplete="organization-title"
                  value={form.role}
                  onValueChange={(value) => setForm((f) => ({ ...f, role: value }))}
                  disabled={status === 'loading'}
                  className="w-full bg-transparent border-b border-white/10 px-1 py-2 text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 placeholder:text-zinc-600"
                  placeholder="ML Engineer @ Acme"
                />
              </Field>

              <Field>
                <FieldLabel className="block font-mono text-[10px] uppercase tracking-widest text-zinc-400 mb-2">
                  What you'd like to chat about <span className="text-zinc-600 normal-case tracking-normal">(optional)</span>
                </FieldLabel>
                <Textarea
                  rows={3}
                  value={form.message}
                  onValueChange={(value) => setForm((f) => ({ ...f, message: value }))}
                  disabled={status === 'loading'}
                  className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-zinc-100 focus:outline-none focus:border-electric-lime transition-colors disabled:opacity-50 placeholder:text-zinc-600 text-sm leading-relaxed resize-none"
                  placeholder="A system you're stuck on, a paper you want to discuss, a collaboration idea..."
                />
              </Field>
            </div>

            <div className="mt-7 flex items-center gap-3">
              <button
                type="submit"
                disabled={status === 'loading' || !form.name.trim() || !form.email.trim()}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-electric-lime text-zinc-950 hover:bg-electric-lime/90 rounded-full px-6 py-3 text-xs uppercase tracking-widest font-mono font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
              <DialogClose className="text-zinc-400 hover:text-zinc-200 text-xs uppercase tracking-widest font-mono transition-colors p-3">
                Not now
              </DialogClose>
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
      </DialogContent>
    </Dialog>
  );
}
