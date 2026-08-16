import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { m, AnimatePresence } from 'motion/react';
import { MessageCircle, Send, X, XCircle } from 'lucide-react';
import Markdown from 'react-markdown';

type Role = 'user' | 'assistant';
type Msg = { role: Role; content: string };
type Source = { title?: string; uri?: string };

const STORAGE_KEY = 'adityaai:lab-chat-v1';
const DEFAULT_STARTERS = [
  "What's Memory Stacks about?",
  'What is FRIDAY?',
  'How do I reach Aditya?',
];

function getStartersForPath(pathname: string): string[] {
  if (pathname === '/projects') {
    return [
      'Tell me about FRIDAY',
      'What stack does Sentinel use?',
      'How does OpalServe work?',
    ];
  }
  if (pathname.startsWith('/articles/')) {
    return [
      'Summarize this essay',
      'What are the main takeaways?',
      'Who is the target audience for this?',
    ];
  }
  if (pathname === '/about') {
    return [
      'What are Aditya\'s certifications?',
      'What is Aditya\'s background?',
      'How do I contact Aditya?',
    ];
  }
  return DEFAULT_STARTERS;
}

function loadSession(): Msg[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Msg[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string',
    );
  } catch {
    return [];
  }
}

function saveSession(messages: Msg[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-12)));
  } catch {
    /* ignore */
  }
}

export default function SiteChatWidget() {
  const location = useLocation();
  const navigate = useNavigate();
  const starters = getStartersForPath(location.pathname);

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setMessages(loadSession());
  }, []);

  useEffect(() => {
    const onOpen = () => {
      setOpen(true);
      setError('');
    };
    window.addEventListener('open-lab-chat', onOpen);
    return () => window.removeEventListener('open-lab-chat', onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 120);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, loading]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const next: Msg[] = [...messages, { role: 'user', content }];
    setMessages(next);
    saveSession(next);
    setInput('');
    setLoading(true);
    setError('');
    setSources([]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: next,
          website: '', // honeypot
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
        sources?: Source[];
        functionCalls?: Array<{ name: string, args: Record<string, unknown> }>;
      };
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : 'Something went wrong.');
        return;
      }
      
      const reply = (data.reply || '').trim();
      if (!reply && !data.functionCalls?.length) {
        setError('Empty reply. Try again.');
        return;
      }
      
      // Handle client-side tool execution
      if (data.functionCalls && data.functionCalls.length > 0) {
        for (const call of data.functionCalls) {
          if (call.name === 'navigateTo' && typeof call.args?.path === 'string') {
            // Close the chat widget slightly after navigating so they see the new page
            setTimeout(() => {
              navigate(call.args.path as string);
              setOpen(false);
            }, 600);
          }
        }
      }

      const withAssistant: Msg[] = [...next, { role: 'assistant', content: reply }];
      setMessages(withAssistant);
      saveSession(withAssistant);
      if (Array.isArray(data.sources)) setSources(data.sources);
    } catch {
      setError('Failed to reach the lab guide. Check your connection.');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send(input);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <m.div
          key="lab-chat"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="fixed bottom-20 right-4 md:bottom-20 md:right-6 z-[55] w-[min(100vw-2rem,24rem)] max-h-[min(70vh,32rem)] flex flex-col rounded-2xl border border-zinc-800 bg-[#0a0a0a] shadow-2xl shadow-black/60 overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lab-chat-title"
        >
          <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-800/80 bg-zinc-950/80">
            <div className="flex items-center gap-2 min-w-0">
              <MessageCircle size={16} className="text-electric-lime shrink-0" />
              <div className="min-w-0">
                <h2
                  id="lab-chat-title"
                  className="font-mono text-[10px] uppercase tracking-[0.18em] text-electric-lime"
                >
                  Lab guide
                </h2>
                <p className="text-zinc-500 text-xs truncate">Essays · projects · how to reach Aditya</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close lab guide"
              className="p-1.5 text-zinc-600 hover:text-zinc-200 transition-colors"
            >
              <X size={16} />
            </button>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[12rem]">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Ask about the essay shelf, FRIDAY / Sentinel / OpalServe, or how to get in touch.
                </p>
                <div className="flex flex-wrap gap-2">
                  {starters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      disabled={loading}
                      className="text-left text-[11px] font-mono uppercase tracking-wider text-zinc-400 border border-zinc-800 rounded-full px-3 py-1.5 hover:border-electric-lime/50 hover:text-electric-lime transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}-${m.content.slice(0, 12)}`}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-electric-lime/15 border border-electric-lime/30 text-zinc-100'
                      : 'bg-zinc-900/80 border border-zinc-800 text-zinc-300'
                  }`}
                >
                  {m.role === 'assistant' ? (
                    <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-a:text-electric-lime prose-ul:my-1.5 prose-li:my-0">
                      <Markdown>{m.content}</Markdown>
                    </div>
                  ) : (
                    m.content
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <p className="text-zinc-600 font-mono text-[10px] uppercase tracking-widest">
                Thinking…
              </p>
            )}

            {error && (
              <p className="text-red-400 text-xs flex items-center gap-1.5">
                <XCircle size={12} />
                {error}
              </p>
            )}

            {sources.length > 0 && (
              <div className="border-t border-zinc-900 pt-2">
                <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 mb-1">
                  Sources
                </p>
                <ul className="space-y-1">
                  {sources.map((s) => (
                    <li key={s.uri || s.title}>
                      <a
                        href={s.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-electric-lime/80 hover:text-electric-lime truncate block"
                      >
                        {s.title || s.uri}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <form onSubmit={onSubmit} className="border-t border-zinc-800 p-3 flex gap-2 items-end">
            <label htmlFor="lab-chat-input" className="sr-only">
              Message
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
            <textarea
              id="lab-chat-input"
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={loading}
              placeholder="Ask the lab guide…"
              className="flex-1 resize-none bg-transparent border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-700 focus:outline-none focus:border-electric-lime/60 disabled:opacity-50 max-h-24"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              aria-label="Send message"
              className="shrink-0 size-10 rounded-full border border-zinc-800 text-zinc-400 hover:text-electric-lime hover:border-electric-lime flex items-center justify-center transition-colors disabled:opacity-40 disabled:hover:text-zinc-400 disabled:hover:border-zinc-800"
            >
              <Send size={16} />
            </button>
          </form>
        </m.div>
      )}
    </AnimatePresence>
  );
}
