import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Coffee,
  Copy,
  FileText,
  GitPullRequest,
  Home,
  Layers,
  MessageCircle,
  Search,
  User,
} from 'lucide-react';
import {
  Dialog,
  DialogBackdrop,
  DialogContent,
  DialogTitle,
} from '@ui-sdk/react/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandItemIcon,
  CommandItemText,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '@ui-sdk/react/command';
import { toast } from '@ui-sdk/react/toast';
import { articles } from '../lib/articles';
import { projects } from '../lib/projects';

const PAGES = [
  { value: 'page:/', label: 'Home', path: '/', icon: Home, keywords: ['lab', 'index', 'start'] },
  { value: 'page:/articles', label: 'Essays', path: '/articles', icon: BookOpen, keywords: ['articles', 'research', 'writing'] },
  { value: 'page:/projects', label: 'Projects', path: '/projects', icon: Layers, keywords: ['friday', 'sentinel', 'midsphere'] },
  { value: 'page:/upstream', label: 'Upstream Ledger', path: '/upstream', icon: GitPullRequest, keywords: ['open source', 'prs', 'merged'] },
  { value: 'page:/about', label: 'About Aditya', path: '/about', icon: User, keywords: ['bio', 'certifications', 'contact'] },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('open-command-palette', onOpen);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('open-command-palette', onOpen);
    };
  }, []);

  function runAction(value: string) {
    setOpen(false);
    if (value.startsWith('page:') || value.startsWith('project:') || value.startsWith('article:')) {
      const path = value.slice(value.indexOf(':') + 1);
      navigate(path);
      return;
    }
    if (value === 'action:chat') {
      window.dispatchEvent(new Event('open-lab-chat'));
      return;
    }
    if (value === 'action:coffee') {
      window.dispatchEvent(new Event('open-virtual-coffee'));
      return;
    }
    if (value === 'action:copy-url') {
      void navigator.clipboard?.writeText(window.location.href).then(() => {
        toast.success('Link copied', { description: window.location.pathname });
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen} presentation="auto">
      <DialogBackdrop className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm transition-opacity duration-200 data-starting-style:opacity-0 data-ending-style:opacity-0" />
      <DialogContent
        aria-label="Command palette"
        className="fixed left-1/2 top-[15vh] z-[71] w-[min(100vw-2rem,36rem)] -translate-x-1/2 rounded-2xl liquid-glass overflow-hidden transition-[opacity,transform] duration-200 data-starting-style:opacity-0 data-starting-style:scale-96 data-ending-style:opacity-0 data-ending-style:scale-96 data-[presentation=sheet]:top-auto data-[presentation=sheet]:bottom-0 data-[presentation=sheet]:left-0 data-[presentation=sheet]:right-0 data-[presentation=sheet]:w-full data-[presentation=sheet]:translate-x-0 data-[presentation=sheet]:rounded-b-none"
      >
        <DialogTitle className="sr-only">Lab Command Palette</DialogTitle>
        <Command onAction={runAction} className="flex flex-col">
          <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3.5">
            <Search size={16} className="text-electric-lime shrink-0" aria-hidden="true" />
            <CommandInput
              aria-label="Search essays, projects, and actions"
              placeholder="Jump to essay, project, or action..."
              className="w-full bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none font-sans"
            />
            <kbd className="hidden sm:inline-flex items-center rounded border border-zinc-700/80 bg-zinc-900/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
              ESC
            </kbd>
          </div>

          <CommandEmpty className="px-4 py-10 text-center font-mono text-xs uppercase tracking-widest text-zinc-500">
            No matching essays, projects, or actions.
          </CommandEmpty>

          <CommandList className="max-h-[min(58vh,26rem)] overflow-y-auto p-2 space-y-2">
            <CommandGroup className="space-y-0.5">
              <CommandGroupLabel className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Actions
              </CommandGroupLabel>
              <CommandItem
                value="action:chat"
                label="Ask the Lab Guide"
                keywords={['chat', 'gemini', 'ai', 'assistant']}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 cursor-pointer transition-colors data-highlighted:bg-electric-lime/12 data-highlighted:text-zinc-50"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <CommandItemIcon className="text-electric-lime shrink-0">
                    <MessageCircle size={15} />
                  </CommandItemIcon>
                  <CommandItemText className="[&_mark]:bg-electric-lime/25 [&_mark]:text-electric-lime [&_mark]:rounded-sm [&_mark]:px-0.5" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">Gemini</span>
              </CommandItem>
              <CommandItem
                value="action:coffee"
                label="Grab a Virtual Coffee"
                keywords={['contact', 'email', 'reach out', 'meet']}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 cursor-pointer transition-colors data-highlighted:bg-electric-lime/12 data-highlighted:text-zinc-50"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <CommandItemIcon className="text-electric-lime shrink-0">
                    <Coffee size={15} />
                  </CommandItemIcon>
                  <CommandItemText className="[&_mark]:bg-electric-lime/25 [&_mark]:text-electric-lime [&_mark]:rounded-sm [&_mark]:px-0.5" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">48h reply</span>
              </CommandItem>
              <CommandItem
                value="action:copy-url"
                label="Copy current page link"
                keywords={['share', 'url', 'clipboard']}
                className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 cursor-pointer transition-colors data-highlighted:bg-electric-lime/12 data-highlighted:text-zinc-50"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <CommandItemIcon className="text-zinc-400 shrink-0">
                    <Copy size={15} />
                  </CommandItemIcon>
                  <CommandItemText className="[&_mark]:bg-electric-lime/25 [&_mark]:text-electric-lime [&_mark]:rounded-sm [&_mark]:px-0.5" />
                </span>
                <CommandShortcut shortcut="mod+c" className="font-mono text-[10px] text-zinc-500" />
              </CommandItem>
            </CommandGroup>

            <CommandSeparator className="h-px bg-white/[0.06] mx-2" />

            <CommandGroup className="space-y-0.5">
              <CommandGroupLabel className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Lab Pages
              </CommandGroupLabel>
              {PAGES.map((p) => {
                const Icon = p.icon;
                return (
                  <CommandItem
                    key={p.value}
                    value={p.value}
                    label={p.label}
                    keywords={p.keywords}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 cursor-pointer transition-colors data-highlighted:bg-electric-lime/12 data-highlighted:text-zinc-50"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <CommandItemIcon className="text-zinc-400 shrink-0">
                        <Icon size={15} />
                      </CommandItemIcon>
                      <CommandItemText className="[&_mark]:bg-electric-lime/25 [&_mark]:text-electric-lime [&_mark]:rounded-sm [&_mark]:px-0.5" />
                    </span>
                    <span className="font-mono text-[10px] text-zinc-500">{p.path}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator className="h-px bg-white/[0.06] mx-2" />

            <CommandGroup className="space-y-0.5">
              <CommandGroupLabel className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Projects
              </CommandGroupLabel>
              {projects.map((p) => (
                <CommandItem
                  key={p.slug}
                  value={`project:/projects/${p.slug}`}
                  label={p.name}
                  keywords={[p.tagline, p.category, ...p.stack]}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 cursor-pointer transition-colors data-highlighted:bg-electric-lime/12 data-highlighted:text-zinc-50"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <CommandItemIcon className="text-zinc-400 shrink-0">
                      <Layers size={15} />
                    </CommandItemIcon>
                    <span className="truncate">
                      <CommandItemText className="[&_mark]:bg-electric-lime/25 [&_mark]:text-electric-lime [&_mark]:rounded-sm [&_mark]:px-0.5" />
                      <span className="ml-2 text-xs text-zinc-500 hidden sm:inline">{p.tagline}</span>
                    </span>
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 shrink-0">
                    {p.category}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator className="h-px bg-white/[0.06] mx-2" />

            <CommandGroup className="space-y-0.5">
              <CommandGroupLabel className="px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                Essays ({articles.length})
              </CommandGroupLabel>
              {articles.map((a) => (
                <CommandItem
                  key={a.slug}
                  value={`article:/articles/${a.slug}`}
                  label={a.title}
                  keywords={[a.form, ...a.topics]}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm text-zinc-300 cursor-pointer transition-colors data-highlighted:bg-electric-lime/12 data-highlighted:text-zinc-50"
                >
                  <span className="flex items-center gap-2.5 min-w-0">
                    <CommandItemIcon className="text-zinc-400 shrink-0">
                      <FileText size={15} />
                    </CommandItemIcon>
                    <CommandItemText className="truncate [&_mark]:bg-electric-lime/25 [&_mark]:text-electric-lime [&_mark]:rounded-sm [&_mark]:px-0.5" />
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 shrink-0">
                    {a.form} · {a.readingTime}m
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
