import { useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';
import SEO from '../components/SEO';
import {
  mergedPrs,
  monthLabel,
  monthStats,
  projectName,
  projectStats,
  type MergedPr,
  type ProjectStat,
} from '../lib/upstreamLedger';

const label = 'font-mono text-[10px] uppercase tracking-[0.22em]';
const stagger = (i: number, n: number, span = 0.6): CSSProperties => ({
  animationDelay: `${(i * Math.min(0.08, span / Math.max(n - 1, 1))).toFixed(2)}s`,
});

const tipAlign = {
  center: 'left-1/2 -translate-x-1/2',
  start: 'left-0',
  end: 'right-0',
} as const;

function Tip({ children, align = 'center' }: { children: ReactNode; align?: keyof typeof tipAlign }) {
  return (
    <span
      role="tooltip"
      className={`pointer-events-none absolute bottom-full ${tipAlign[align]} z-20 mb-2 w-max max-w-[min(16rem,calc(100vw-3rem))] rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-left font-mono text-[11px] leading-snug text-zinc-200 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100`}
    >
      {children}
    </span>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-800/70 bg-[#0a0a0a] p-5 md:p-7">
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className={`${label} flex items-center gap-2 text-electric-lime`}>
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-electric-lime" />
          {title}
        </h2>
        {note && <p className={`${label} text-zinc-500`}>{note}</p>}
      </div>
      {children}
    </section>
  );
}

function ProjectBars({
  stats,
  selected,
  onSelect,
  metric,
}: {
  stats: ProjectStat[];
  selected: string | null;
  onSelect: (repo: string) => void;
  metric: 'merged' | 'lines';
}) {
  const rows = metric === 'lines'
    ? [...stats].sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions) || a.name.localeCompare(b.name))
    : stats;
  const top = Math.max(1, ...rows.map((s) => (metric === 'lines' ? s.additions + s.deletions : s.merged)));
  return (
    <ul className="space-y-2">
      {rows.map((s, i) => {
        const active = selected === null || selected === s.repo;
        const total = metric === 'lines' ? s.additions + s.deletions : s.merged;
        const value = metric === 'lines' ? `+${s.additions} −${s.deletions}` : String(s.merged);
        const aria = metric === 'lines'
          ? `${s.name}: ${s.additions} lines added, ${s.deletions} removed. Filter by ${s.name}.`
          : `${s.name}: ${s.merged} merged, ${s.tested} with a regression test. Filter by ${s.name}.`;
        return (
          <li key={s.repo}>
            <button
              type="button"
              onClick={() => onSelect(s.repo)}
              aria-pressed={selected === s.repo}
              aria-label={aria}
              data-repo={s.repo}
              data-value={metric === 'lines' ? `${s.additions},${s.deletions}` : s.merged}
              className={`group relative grid w-full grid-cols-[6.5rem_1fr] items-center gap-3 rounded-md px-2 py-1.5 text-left transition-opacity focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime sm:grid-cols-[12rem_1fr] ${active ? 'opacity-100' : 'opacity-35 hover:opacity-70'}`}
            >
              <span className="truncate font-mono text-xs text-zinc-200">{s.name}</span>
              <span className="flex items-center gap-3">
                <span className="relative flex h-4 min-w-12 flex-1 overflow-hidden rounded bg-zinc-900">
                  {metric === 'lines' ? (
                    <>
                      <span className="h-full rounded-l bg-electric-lime motion-safe:animate-grow-x" style={{ width: `${(s.additions / top) * 100}%`, ...stagger(i, rows.length) }} />
                      <span className="h-full rounded-r bg-zinc-600 motion-safe:animate-grow-x" style={{ width: `${(s.deletions / top) * 100}%`, ...stagger(i, rows.length, 0.9) }} />
                    </>
                  ) : (
                    <span className="h-full rounded bg-electric-lime motion-safe:animate-grow-x" style={{ width: `${(total / top) * 100}%`, ...stagger(i, rows.length) }} />
                  )}
                </span>
                <span className="shrink-0 whitespace-nowrap font-mono text-xs font-semibold text-zinc-100 sm:w-28">{value}</span>
              </span>
              <Tip>
                {s.name} · {s.merged} merged · {s.tested}/{s.merged} with tests · +{s.additions} −{s.deletions}
              </Tip>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function MonthlyChart({ items }: { items: MergedPr[] }) {
  const months = monthStats(items);
  const top = Math.max(1, ...months.map((m) => m.merged));
  const points = months
    .map((m, i) => `${((i + 0.5) / months.length) * 100},${100 - (m.merged / top) * 100}`)
    .join(' ');
  return (
    <div className="relative">
      <div className="relative h-48 border-b border-zinc-800">
        <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible">
          <polyline
            points={points}
            pathLength={1}
            fill="none"
            stroke="#CAFF4A"
            strokeWidth={2.5}
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
            className="motion-safe:animate-draw-line"
          />
        </svg>
        <ul className="absolute inset-0 flex items-end">
          {months.map((m, i) => {
            const prs = items.filter((p) => p.mergedAt.startsWith(m.month));
            return (
              <li key={m.month} className="flex h-full flex-1 items-end justify-center">
                <span
                  tabIndex={0}
                  aria-label={`${m.label}: ${m.merged} merged`}
                  data-month={m.month}
                  data-value={m.merged}
                  className="group relative flex h-full w-1/2 max-w-24 items-end justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime"
                >
                  <span
                    className="w-full rounded-t bg-electric-lime/30 ring-1 ring-electric-lime/60 motion-safe:animate-grow-y"
                    style={{ height: `${(m.merged / top) * 100}%`, ...stagger(i, months.length, 0.4) }}
                  />
                  <span className="absolute font-mono text-sm font-semibold text-zinc-100" style={{ bottom: `calc(${(m.merged / top) * 100}% + 0.5rem)`, top: 'auto' }}>
                    {m.merged}
                  </span>
                  <Tip align={i === 0 ? 'start' : i === months.length - 1 ? 'end' : 'center'}>
                    {m.label} · {m.merged} merged
                    {prs.length > 0 && <><br />{prs.map((p) => `${projectName(p.repo)} #${p.number}`).join(', ')}</>}
                  </Tip>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <ul className="mt-3 flex">
        {months.map((m) => (
          <li key={m.month} className={`${label} flex-1 text-center text-zinc-500`}>{monthLabel(m.month)}</li>
        ))}
      </ul>
    </div>
  );
}

function TestGrid({ stats, items }: { stats: ProjectStat[]; items: MergedPr[] }) {
  let k = 0;
  return (
    <div>
      <ul className="space-y-3">
        {stats.map((s) => {
          const prs = items.filter((p) => p.repo === s.repo).sort((a, b) => Number(!a.test) - Number(!b.test));
          return (
            <li key={s.repo} className="relative grid grid-cols-[6.5rem_1fr] items-center gap-3 px-2 sm:grid-cols-[12rem_1fr]" data-repo={s.repo} data-tested={s.tested} data-total={s.merged}>
              <span className="truncate font-mono text-xs text-zinc-200">{s.name}</span>
              <span className="flex flex-wrap items-center gap-1.5">
                {prs.map((p) => {
                  const i = k++;
                  return (
                    <a
                      key={p.url}
                      href={p.test?.url ?? p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={p.test ? `${s.name} #${p.number}: regression test ${p.test.label}` : `${s.name} #${p.number}: no regression test, opens the PR`}
                      className={`group block h-5 w-5 rounded-[5px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime motion-safe:animate-[fadeIn_0.35s_ease-out_both] ${p.test ? 'bg-electric-lime hover:bg-white' : 'border border-zinc-600 hover:border-zinc-300'}`}
                      style={stagger(i, items.length, 1.1)}
                    >
                      <Tip align="start">
                        {s.name} #{p.number}
                        <br />
                        {p.test ? p.test.label : 'No regression test'}
                      </Tip>
                    </a>
                  );
                })}
                <span className="ml-2 font-mono text-xs text-zinc-500">{s.tested}/{s.merged}</span>
              </span>
            </li>
          );
        })}
      </ul>
      <p className={`${label} mt-5 flex flex-wrap gap-5 text-zinc-500`}>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-[4px] bg-electric-lime" />Ships a regression test</span>
        <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-[4px] border border-zinc-600" />No test</span>
      </p>
    </div>
  );
}

export default function Upstream() {
  const [selected, setSelected] = useState<string | null>(null);
  const allStats = useMemo(() => projectStats(mergedPrs), []);
  const items = useMemo(() => (selected ? mergedPrs.filter((p) => p.repo === selected) : mergedPrs), [selected]);
  const stats = useMemo(() => projectStats(items), [items]);
  const tested = items.filter((p) => p.test).length;
  const toggle = (repo: string) => setSelected((cur) => (cur === repo ? null : repo));
  const scope = selected ? projectName(selected) : 'all projects';

  return (
    <div className="min-h-screen pt-32 pb-24">
      <SEO
        title="Upstream | Aditya Gaurav - Merged open-source fixes"
        description={`${mergedPrs.length} merged pull requests in TensorFlow, gVisor, Grafana and more, with the regression test behind each fix.`}
        canonicalUrl="https://www.adityaai.dev/upstream"
        breadcrumbs={[
          { name: 'Home', url: 'https://www.adityaai.dev/' },
          { name: 'Upstream', url: 'https://www.adityaai.dev/upstream' },
        ]}
      />
      <div className="mx-auto max-w-6xl px-6 md:px-8 lg:px-12">
        <header className="mb-12 border-b border-zinc-800/50 pb-8">
          <p className={`${label} mb-4 text-electric-lime`}>Upstream · merged fixes</p>
          <h1 className="mb-4 font-display text-[clamp(2.5rem,8vw,4rem)] font-semibold leading-[1.1] tracking-[-0.02em] text-zinc-50">
            Upstream ledger
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-400">
            Merged fixes in the projects AI infrastructure is built on. {mergedPrs.length} pull requests across{' '}
            {allStats.length} projects, and {mergedPrs.filter((p) => p.test).length} of them ship a regression test
            that upstream now runs.
          </p>
        </header>

        <div role="group" aria-label="Filter by project" className="mb-8 flex flex-wrap gap-2">
          {[{ repo: null as string | null, name: 'All', merged: mergedPrs.length }, ...allStats].map((s) => (
            <button
              key={s.repo ?? 'all'}
              type="button"
              aria-pressed={selected === s.repo}
              onClick={() => setSelected(s.repo === null ? null : s.repo === selected ? null : s.repo)}
              className={`rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime ${selected === s.repo ? 'border-electric-lime bg-electric-lime text-zinc-950' : 'border-zinc-800 text-zinc-400 hover:border-electric-lime hover:text-electric-lime'}`}
            >
              {s.name} · {s.merged}
            </button>
          ))}
        </div>
        <p className="sr-only" aria-live="polite">
          Showing {items.length} merged pull requests for {scope}.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title="Merged PRs by project" note={`${mergedPrs.length} total · click to filter`}>
            <ProjectBars stats={allStats} selected={selected} onSelect={toggle} metric="merged" />
          </Panel>
          <Panel title="Merges per month" note={scope}>
            <MonthlyChart items={items} />
          </Panel>
          <Panel title={`${tested} of ${items.length} ship a regression test`} note="each square opens its test">
            <TestGrid stats={stats} items={items} />
          </Panel>
          <Panel title="Lines changed by project" note="click to filter">
            <ProjectBars stats={allStats} selected={selected} onSelect={toggle} metric="lines" />
          </Panel>
        </div>

        <section className="mt-16" aria-labelledby="upstream-list">
          <h2 id="upstream-list" className="mb-6 font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-zinc-50">
            {selected ? `${projectName(selected)} · ${items.length} merged` : `All ${items.length} merged fixes`}
          </h2>
          <ul className="border-t border-zinc-800/70">
            {items.map((p) => (
              <li key={p.url} className="flex flex-col gap-4 border-b border-zinc-800/70 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
                <div className="min-w-0 flex-1">
                  <p className="mb-2 font-mono text-[11px] uppercase tracking-widest text-zinc-500">
                    {p.repo} <span className="text-electric-lime/80">#{p.number}</span> · {monthLabel(p.mergedAt.slice(0, 7))} · +{p.additions} −{p.deletions}
                  </p>
                  <p className="text-sm leading-relaxed text-zinc-300 md:text-base">{p.title}</p>
                </div>
                <div className="flex shrink-0 gap-2 self-start">
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-zinc-800 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:border-electric-lime hover:text-electric-lime focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime">
                    PR <ArrowUpRight size={12} />
                  </a>
                  {p.test && (
                    <a href={p.test.url} target="_blank" rel="noopener noreferrer" aria-label={`Regression test ${p.test.label}`} className="inline-flex items-center gap-1 rounded-full border border-zinc-800 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:border-electric-lime hover:text-electric-lime focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime">
                      Test <ArrowUpRight size={12} />
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
