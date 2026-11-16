import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, RotateCcw, Send, X, XCircle } from 'lucide-react';
import Markdown from 'react-markdown';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@ui-sdk/react/dialog';

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
      'How does MidSphere work?',
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
      "What are Aditya's certifications?",
      "What is Aditya's background?",
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
  const lastSentRef = useRef<number>(0);

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
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, loading]);

  function clearChat() {
    setMessages([]);
    setSources([]);
    setError('');
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || loading) return;

    const now = Date.now();
    if (now - lastSentRef.current < 2000) {
      setError('Please wait a moment before sending another message.');
      return;
    }
    lastSentRef.current = now;

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
          website: '',
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        reply?: string;
        error?: string;
        sources?: Source[];
        functionCalls?: Array<{ name: string; args: Record<string, unknown> }>;
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

      if (data.functionCalls && data.functionCalls.length > 0) {
        for (const call of data.functionCalls) {
          if (
            call.name === 'navigateTo' &&
            typeof call.args?.path === 'string' &&
            call.args.path.startsWith('/') &&
            !call.args.path.startsWith('//') &&
            !call.args.path.startsWith('/\\')
          ) {
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
    <Dialog open={open} onOpenChange={setOpen} modal={false} presentation="auto">
      <DialogContent
        initialFocus={() => inputRef.current}
        className="fixed bottom-20 right-4 md:bottom-20 md:right-6 z-[55] w-[min(100vw-2rem,24rem)] max-h-[min(70vh,32rem)] flex flex-col rounded-2xl liquid-glass overflow-hidden transition-[opacity,transform] duration-200 data-starting-style:opacity-0 data-starting-style:translate-y-3 data-starting-style:scale-96 data-ending-style:opacity-0 data-ending-style:translate-y-3 data-ending-style:scale-96 data-[presentation=sheet]:bottom-0 data-[presentation=sheet]:right-0 data-[presentation=sheet]:left-0 data-[presentation=sheet]:w-full data-[presentation=sheet]:max-h-[80vh] data-[presentation=sheet]:rounded-b-none"
      >
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-white/[0.08] bg-black/30">
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle size={16} className="text-electric-lime shrink-0" />
            <div className="min-w-0">
              <DialogTitle className="font-mono text-[10px] uppercase tracking-[0.18em] text-electric-lime">
                Lab guide
              </DialogTitle>
              <DialogDescription className="text-zinc-400 text-xs truncate">
                Essays · projects · how to reach Aditya
              </DialogDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                aria-label="Clear chat history"
                title="Clear chat"
                className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
              >
                <RotateCcw size={14} />
              </button>
            )}
            <DialogClose
              aria-label="Close lab guide"
              className="p-1.5 rounded-full text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.06] transition-colors"
            >
              <X size={16} />
            </DialogClose>
          </div>
        </header>

        <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[12rem]">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-zinc-400 text-sm leading-relaxed">
                Ask about the essay shelf, FRIDAY / Sentinel / MidSphere, or how to get in touch.
              </p>
              <div className="flex flex-wrap gap-2">
                {starters.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void send(s)}
                    disabled={loading}
                    className="text-left text-[11px] font-mono uppercase tracking-wider text-zinc-300 border border-white/10 bg-white/[0.03] rounded-full px-3 py-1.5 hover:border-electric-lime/50 hover:text-electric-lime transition-colors disabled:opacity-50"
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
                    : 'bg-white/[0.04] border border-white/[0.08] text-zinc-200'
                }`}
              >
                {m.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm max-w-none prose-p:my-1.5 prose-a:text-electric-lime prose-ul:my-1.5 prose-li:my-0">
                    <Markdown
                      skipHtml
                      allowedElements={[
                        'p',
                        'strong',
                        'em',
                        'code',
                        'pre',
                        'ul',
                        'ol',
                        'li',
                        'a',
                        'blockquote',
                        'hr',
                        'h1',
                        'h2',
                        'h3',
                        'h4',
                      ]}
                      urlTransform={(url) => {
                        if (
                          url.startsWith('http://') ||
                          url.startsWith('https://') ||
                          (url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/\\')) ||
                          url.startsWith('mailto:')
                        ) {
                          return url;
                        }
                        return '';
                      }}
                    >
                      {m.content}
                    </Markdown>
                  </div>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}

          {loading && (
            <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">
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
            <div className="border-t border-white/[0.06] pt-2">
              <p className="font-mono text-[9px] uppercase tracking-widest text-zinc-500 mb-1">
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

        <form onSubmit={onSubmit} className="border-t border-white/[0.08] p-3 flex gap-2 items-end bg-black/20">
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
            className="flex-1 resize-none bg-white/[0.03] border border-white/10 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-electric-lime/60 disabled:opacity-50 max-h-24"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="shrink-0 size-10 rounded-full liquid-orb text-zinc-300 hover:text-electric-lime flex items-center justify-center transition-colors disabled:opacity-40"
          >
            <Send size={15} />
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
