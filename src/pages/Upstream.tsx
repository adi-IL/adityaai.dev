import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { ArrowUpRight, Check, Search, X } from 'lucide-react';
import SEO from '../components/SEO';
import {
  mergedPrs,
  monthLabel,
  monthStats,
  projectName,
  projectStats,
  receiptFor,
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
      className={`pointer-events-none absolute bottom-full ${tipAlign[align]} z-30 mb-2.5 hidden w-max max-w-[min(16rem,calc(100vw-3rem))] whitespace-normal [overflow-wrap:anywhere] rounded-lg border border-zinc-700/90 bg-zinc-950/95 px-3 py-2 text-left font-mono text-[11px] leading-snug text-zinc-200 opacity-0 shadow-[0_12px_32px_rgba(0,0,0,0.85)] backdrop-blur-md transition-opacity duration-150 group-hover:block group-hover:opacity-100 group-focus-visible:block group-focus-visible:opacity-100`}
    >
      {children}
    </span>
  );
}

function Panel({
  title,
  note,
  index = 0,
  children,
}: {
  title: string;
  note?: string;
  index?: number;
  children: ReactNode;
}) {
  return (
    <section
      style={{ animationDelay: `${(index * 0.07).toFixed(2)}s` }}
      className="animate-fade-up motion-reduce:animate-none relative flex flex-col justify-between overflow-visible rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] p-6 md:p-8 transition-colors duration-300 hover:border-zinc-700/80"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/60 to-transparent"
      />
      <div>
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-900 pb-4">
          <h2 className={`${label} flex items-center gap-2.5 text-zinc-200`}>
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)]"
            />
            {title}
          </h2>
          {note && <p className={`${label} text-zinc-500`}>{note}</p>}
        </div>
        {children}
      </div>
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
  const rows =
    metric === 'lines'
      ? [...stats].sort(
          (a, b) =>
            b.additions + b.deletions - (a.additions + a.deletions) || a.name.localeCompare(b.name),
        )
      : stats;
  const top = Math.max(
    1,
    ...rows.map((s) => (metric === 'lines' ? s.additions + s.deletions : s.merged)),
  );
  const totalAdditions = rows.reduce((acc, s) => acc + s.additions, 0);
  const totalDeletions = rows.reduce((acc, s) => acc + s.deletions, 0);

  return (
    <div>
      {metric === 'lines' && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-900 bg-zinc-950/60 px-3.5 py-2.5">
          <div className={`${label} flex flex-wrap items-center gap-5 text-zinc-400`}>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#749e1b]" />
              Additions{' '}
              <span className="tabular-nums text-zinc-200">+{totalAdditions.toLocaleString()}</span>
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[2px] bg-[#d55181]" />
              Deletions{' '}
              <span className="tabular-nums text-zinc-200">−{totalDeletions.toLocaleString()}</span>
            </span>
          </div>
          <span className="font-mono text-[10px] tabular-nums text-zinc-500">
            {(totalAdditions + totalDeletions).toLocaleString()} lines
          </span>
        </div>
      )}
      <ul className="space-y-1.5">
        {rows.map((s, i) => {
          const isSelected = selected === s.repo;
          const active = selected === null || isSelected;
          const total = metric === 'lines' ? s.additions + s.deletions : s.merged;
          const aria =
            metric === 'lines'
              ? `${s.name}: ${s.additions} lines added, ${s.deletions} removed. Filter by ${s.name}.`
              : `${s.name}: ${s.merged} merged, ${s.tested} with a regression test. Filter by ${s.name}.`;
          return (
            <li key={s.repo}>
              <button
                type="button"
                onClick={() => onSelect(s.repo)}
                aria-pressed={isSelected}
                aria-label={aria}
                data-repo={s.repo}
                data-value={metric === 'lines' ? `${s.additions},${s.deletions}` : s.merged}
                className={`group relative grid w-full grid-cols-[6.75rem_1fr] items-center gap-3 rounded-lg px-2.5 py-1.5 text-left transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime sm:grid-cols-[10.5rem_1fr] ${
                  isSelected
                    ? 'bg-zinc-900/80 ring-1 ring-electric-lime/40'
                    : 'hover:bg-zinc-900/40'
                } ${active ? 'opacity-100' : 'opacity-35 hover:opacity-75'}`}
              >
                <span className="flex items-center gap-2 truncate font-mono text-xs text-zinc-200 group-hover:text-white">
                  <span
                    aria-hidden
                    className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${
                      isSelected ? 'bg-electric-lime' : 'bg-zinc-700 group-hover:bg-zinc-400'
                    }`}
                  />
                  <span className="truncate">{s.name}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="relative flex h-3 min-w-12 flex-1 items-center gap-[2px] overflow-hidden rounded-r-[4px] bg-zinc-900/90">
                    {metric === 'lines' ? (
                      <>
                        {s.additions > 0 && (
                          <span
                            className={`h-full bg-[#749e1b] group-hover:brightness-110 motion-safe:animate-grow-x ${
                              s.deletions === 0 ? 'rounded-r-[4px]' : ''
                            }`}
                            style={{
                              width: `${(s.additions / top) * 100}%`,
                              minWidth: '3px',
                              ...stagger(i, rows.length),
                            }}
                          />
                        )}
                        {s.deletions > 0 && (
                          <span
                            className="h-full rounded-r-[4px] bg-[#d55181] group-hover:brightness-110 motion-safe:animate-grow-x"
                            style={{
                              width: `${(s.deletions / top) * 100}%`,
                              minWidth: '3px',
                              ...stagger(i, rows.length, 0.9),
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <span
                        className="h-full rounded-r-[4px] bg-electric-lime group-hover:bg-white transition-colors motion-safe:animate-grow-x"
                        style={{
                          width: `${(total / top) * 100}%`,
                          minWidth: '4px',
                          ...stagger(i, rows.length),
                        }}
                      />
                    )}
                  </span>
                  {metric === 'lines' ? (
                    <span className="shrink-0 whitespace-nowrap font-mono text-xs tabular-nums sm:w-28 sm:text-right">
                      <span className="font-semibold text-zinc-100">+{s.additions}</span>{' '}
                      <span className="text-zinc-500">−{s.deletions}</span>
                    </span>
                  ) : (
                    <span className="shrink-0 whitespace-nowrap font-mono text-xs tabular-nums sm:w-20 sm:text-right">
                      <span className="font-semibold text-zinc-100">{s.merged}</span>{' '}
                      <span className="text-[10px] text-zinc-500">({s.tested}t)</span>
                    </span>
                  )}
                </span>
                <Tip>
                  <span className="font-semibold text-zinc-100">{s.name}</span> · {s.merged} merged
                  <br />
                  <span className="text-zinc-400">
                    {s.tested}/{s.merged} with tests · +{s.additions} −{s.deletions}
                  </span>
                </Tip>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function MonthlyChart({ items }: { items: MergedPr[] }) {
  const months = monthStats(items);
  const top = Math.max(1, ...months.map((m) => m.merged));
  const mid = Math.round(top / 2);

  // Plot coordinates in [0..100] x [0..100] where y=12 is top peak and y=100 is baseline,
  // giving 12% top headroom so peak labels and rings never clip the header.
  const yFor = (val: number) => 100 - (val / top) * 82;
  const xFor = (i: number) => ((i + 0.5) / months.length) * 100;

  const linePoints = months.map((m, i) => `${xFor(i)},${yFor(m.merged)}`).join(' ');
  const areaPoints = `${xFor(0)},100 ${linePoints} ${xFor(months.length - 1)},100`;

  const totalInWindow = months.reduce((acc, m) => acc + m.merged, 0);
  const peak = months.reduce((best, m) => (m.merged >= best.merged ? m : best), months[0]);

  return (
    <div className="relative">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-900 bg-zinc-950/60 px-3.5 py-2.5">
        <span className={`${label} text-zinc-400`}>
          Window <span className="text-zinc-200">{months[0]?.label} – {months.at(-1)?.label}</span>
        </span>
        <span className="font-mono text-[10px] tabular-nums text-zinc-400">
          Peak: <span className="text-electric-lime">{peak?.merged ?? 0}</span> in {peak?.label}
        </span>
      </div>

      <div className="relative h-52 border-b border-zinc-800">
        {/* Recessive solid 1px horizontal reference gridlines */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 border-t border-zinc-800/60"
          style={{ bottom: '82%' }}
        >
          <span className="absolute -top-4 right-0 font-mono text-[10px] tabular-nums text-zinc-600">
            {top}
          </span>
        </div>
        {mid > 0 && mid < top && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 border-t border-zinc-900"
            style={{ bottom: `${(mid / top) * 82}%` }}
          >
            <span className="absolute -top-4 right-0 font-mono text-[10px] tabular-nums text-zinc-600">
              {mid}
            </span>
          </div>
        )}

        <svg
          aria-hidden
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 z-10 h-full w-full overflow-visible"
        >
          <defs>
            <linearGradient id="upstream-cadence-wash" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CAFF4A" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#CAFF4A" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <polygon points={areaPoints} fill="url(#upstream-cadence-wash)" />
          <polyline
            points={linePoints}
            pathLength={1}
            fill="none"
            stroke="#CAFF4A"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="motion-safe:animate-draw-line"
          />
        </svg>

        <ul className="absolute inset-0 z-20 flex items-end">
          {months.map((m, i) => {
            const prs = items.filter((p) => p.mergedAt.startsWith(m.month));
            const heightPct = (m.merged / top) * 82;
            return (
              <li key={m.month} className="flex h-full flex-1 items-end justify-center">
                <span
                  tabIndex={0}
                  aria-label={`${m.label}: ${m.merged} merged`}
                  data-month={m.month}
                  data-value={m.merged}
                  className="group relative flex h-full w-full max-w-24 items-end justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime"
                >
                  {/* Hover crosshair guide */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-electric-lime/0 transition-colors duration-150 group-hover:bg-electric-lime/35 group-focus-visible:bg-electric-lime/35"
                  />
                  {/* Thin column mark (<= 24px wide, 4px rounded top, square baseline, no border) */}
                  <span
                    className="w-5 rounded-t-[4px] bg-electric-lime/20 transition-colors duration-200 group-hover:bg-electric-lime/40 motion-safe:animate-grow-y"
                    style={{
                      height: `${heightPct}%`,
                      minHeight: m.merged > 0 ? '4px' : '0px',
                      ...stagger(i, months.length, 0.4),
                    }}
                  />
                  {/* Circular >=8px marker with 2px #0a0a0a surface ring */}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 h-2.5 w-2.5 -translate-x-1/2 translate-y-1/2 rounded-full bg-electric-lime ring-2 ring-[#0a0a0a] transition-transform duration-150 group-hover:scale-125 group-hover:bg-white"
                    style={{ bottom: `${heightPct}%` }}
                  />
                  {/* Direct value readout */}
                  <span
                    className="pointer-events-none absolute font-mono text-xs font-semibold tabular-nums text-zinc-100 transition-colors group-hover:text-electric-lime"
                    style={{ bottom: `calc(${heightPct}% + 0.55rem)`, top: 'auto' }}
                  >
                    {m.merged}
                  </span>
                  <Tip align={i === 0 ? 'start' : i === months.length - 1 ? 'end' : 'center'}>
                    <span className="font-semibold text-zinc-100">{m.label}</span> · {m.merged} merged
                    { totalInWindow > 0 ? ` (${Math.round((m.merged / totalInWindow) * 100)}%)` : '' }
                    {prs.length > 0 && (
                      <>
                        <br />
                        <span className="text-zinc-400">
                          {prs.map((p) => `${projectName(p.repo)} #${p.number}`).join(', ')}
                        </span>
                      </>
                    )}
                  </Tip>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <ul className="mt-3 flex">
        {months.map((m) => (
          <li key={m.month} className={`${label} flex-1 text-center tabular-nums text-zinc-400`}>
            {monthLabel(m.month)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestGrid({ stats, items }: { stats: ProjectStat[]; items: MergedPr[] }) {
  let k = 0;
  const testedCount = items.filter((p) => p.test).length;
  const pct = Math.round((testedCount / Math.max(1, items.length)) * 100);

  return (
    <div>
      {/* Same-ramp coverage meter */}
      <div className="mb-5 rounded-xl border border-zinc-900 bg-zinc-950/60 p-3.5">
        <div className="mb-2 flex items-baseline justify-between gap-2">
          <span className={`${label} text-zinc-400`}>Regression proof coverage</span>
          <span className="font-mono text-xs font-semibold tabular-nums text-electric-lime">
            {pct}% ({testedCount}/{items.length})
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-electric-lime/15">
          <div
            className="h-full rounded-full bg-electric-lime transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2.5">
        {stats.map((s) => {
          const prs = items
            .filter((p) => p.repo === s.repo)
            .sort((a, b) => Number(!a.test) - Number(!b.test));
          return (
            <li
              key={s.repo}
              className="relative grid grid-cols-[6.75rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-1 hover:bg-zinc-900/30 sm:grid-cols-[10.5rem_1fr_auto]"
              data-repo={s.repo}
              data-tested={s.tested}
              data-total={s.merged}
            >
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
                      aria-label={
                        p.test
                          ? `${s.name} #${p.number}: regression test ${p.test.label}`
                          : `${s.name} #${p.number}: no regression test, opens the PR`
                      }
                      className={`group relative flex h-5 w-5 items-center justify-center rounded-[5px] transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime motion-safe:animate-[fadeIn_0.35s_ease-out_both] ${
                        p.test
                          ? 'bg-electric-lime text-zinc-950 shadow-[0_0_10px_rgba(202,255,74,0.16)] hover:scale-110 hover:bg-white'
                          : 'border border-zinc-700 bg-zinc-900/60 hover:scale-105 hover:border-zinc-400'
                      }`}
                      style={stagger(i, items.length, 1.1)}
                    >
                      {p.test && <Check size={11} strokeWidth={3} aria-hidden className=" opacity-80" />}
                      <Tip align="start">
                        <span className="font-semibold text-zinc-100">
                          {s.name} #{p.number}
                        </span>
                        <br />
                        <span className={p.test ? 'text-electric-lime' : 'text-zinc-400'}>
                          {p.test ? `Test: ${p.test.label}` : 'No regression test'}
                        </span>
                      </Tip>
                    </a>
                  );
                })}
              </span>
              <span className="w-12 text-right font-mono text-xs tabular-nums text-zinc-400">
                <span className="text-zinc-200">{s.tested}</span>/{s.merged}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={`${label} mt-5 flex flex-wrap gap-5 border-t border-zinc-900 pt-4 text-zinc-400`}>
        <span className="flex items-center gap-2">
          <span className="flex h-3.5 w-3.5 items-center justify-center rounded-[4px] bg-electric-lime text-zinc-950">
            <Check size={9} strokeWidth={3} aria-hidden />
          </span>
          Ships a regression test
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3.5 w-3.5 rounded-[4px] border border-zinc-700 bg-zinc-900/60" />
          Opens PR (no test link)
        </span>
      </p>
    </div>
  );
}

export default function Upstream() {
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [onlyTested, setOnlyTested] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'diff'>('recent');
  const [showSummaryTable, setShowSummaryTable] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && (selected !== null || query !== '' || onlyTested)) {
        setSelected(null);
        setQuery('');
        setOnlyTested(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selected, query, onlyTested]);

  const allStats = useMemo(() => projectStats(mergedPrs), []);
  const items = useMemo(
    () => (selected ? mergedPrs.filter((p) => p.repo === selected) : mergedPrs),
    [selected],
  );
  const stats = useMemo(() => projectStats(items), [items]);
  const tested = useMemo(() => items.filter((p) => p.test).length, [items]);
  const totalAdditions = useMemo(() => items.reduce((acc, p) => acc + p.additions, 0), [items]);
  const totalDeletions = useMemo(() => items.reduce((acc, p) => acc + p.deletions, 0), [items]);
  const testRate = Math.round((tested / Math.max(1, items.length)) * 100);

  const ledgerItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = items.filter((p) => {
      if (onlyTested && !p.test) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.repo.toLowerCase().includes(q) ||
        projectName(p.repo).toLowerCase().includes(q) ||
        `#${p.number}`.includes(q) ||
        (p.test?.label.toLowerCase().includes(q) ?? false)
      );
    });
    if (sortBy === 'diff') {
      return [...filtered].sort(
        (a, b) => b.additions + b.deletions - (a.additions + a.deletions) || b.mergedAt.localeCompare(a.mergedAt),
      );
    }
    return filtered;
  }, [items, query, onlyTested, sortBy]);

  const toggle = (repo: string) => setSelected((cur) => (cur === repo ? null : repo));
  const scope = selected ? projectName(selected) : 'all projects';
  const hasActiveFilters = selected !== null || query.trim() !== '' || onlyTested;

  return (
    <div className="min-h-screen overflow-x-clip pt-32 pb-24">
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
        <header className="relative mb-10 border-b border-zinc-800/60 pb-10">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-12 -left-12 h-64 w-96 rounded-full bg-electric-lime/[0.04] blur-3xl"
          />
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className={`${label} flex items-center gap-2.5 text-electric-lime`}>
              <span
                aria-hidden
                className="size-1.5 rounded-full bg-electric-lime shadow-[0_0_8px_rgba(202,255,74,0.8)]"
              />
              Upstream · merged fixes
            </p>
            <div className="flex items-center gap-3">
              {selected && (
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-electric-lime/40 bg-electric-lime/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-electric-lime transition-colors hover:bg-electric-lime hover:text-zinc-950"
                >
                  Scope: {projectName(selected)} <X size={11} />
                </button>
              )}
              <button
                type="button"
                aria-expanded={showSummaryTable}
                onClick={() => setShowSummaryTable((v) => !v)}
                className="rounded-full border border-zinc-800 bg-[#0a0a0a] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-zinc-400 transition-colors hover:border-zinc-600 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime"
              >
                {showSummaryTable ? 'Hide data table' : 'Table view'}
              </button>
            </div>
          </div>

          <h1 className="mb-4 font-display text-[clamp(2.5rem,8vw,4rem)] font-semibold leading-[1.08] tracking-[-0.02em] text-zinc-50">
            Upstream ledger
          </h1>
          <p className="max-w-2xl text-lg leading-relaxed text-zinc-400">
            Merged fixes in the projects AI infrastructure is built on. {mergedPrs.length} pull requests across{' '}
            {allStats.length} projects, and {mergedPrs.filter((p) => p.test).length} of them ship a regression test
            that upstream now runs.
          </p>

          {/* 4-Tile KPI Telemetry Bar */}
          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-800/60 lg:grid-cols-4">
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Merged pull requests</dt>
              <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
                {items.length}
              </dd>
              <p className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-400">
                {selected ? `in ${projectName(selected)} (of ${mergedPrs.length})` : `100% merged to main`}
              </p>
            </div>
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Upstream repositories</dt>
              <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
                {stats.length}
              </dd>
              <p className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-400">
                {selected ? selected : `Across ${allStats.length} open-source orgs`}
              </p>
            </div>
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Regression test rate</dt>
              <dd className="mt-2 font-sans text-4xl font-semibold tracking-tight text-electric-lime md:text-5xl">
                {testRate}%
              </dd>
              <p className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-400">
                {tested} of {items.length} ship a verified test
              </p>
            </div>
            <div className="bg-[#0a0a0a] p-5 md:p-6">
              <dt className={`${label} text-zinc-400`}>Lines changed</dt>
              <dd className="mt-2 font-sans text-3xl font-semibold tracking-tight text-zinc-50 md:text-4xl">
                +{(totalAdditions + totalDeletions).toLocaleString()}
              </dd>
              <p className="mt-1.5 font-mono text-[11px] tabular-nums text-zinc-400">
                <span className="text-zinc-200">+{totalAdditions.toLocaleString()}</span> added ·{' '}
                <span className="text-zinc-400">−{totalDeletions.toLocaleString()}</span> removed
              </p>
            </div>
          </dl>

          {/* Accessible Data Table View Twin */}
          {showSummaryTable && (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-zinc-800/80 bg-[#0a0a0a] p-4">
              <table className="w-full border-collapse text-left font-mono text-xs tabular-nums">
                <caption className="sr-only">Upstream contributions summary by repository</caption>
                <thead>
                  <tr className="border-b border-zinc-800 text-[10px] uppercase tracking-widest text-zinc-400">
                    <th className="py-2.5 pr-4">Project</th>
                    <th className="py-2.5 px-4">Repository</th>
                    <th className="py-2.5 px-4 text-right">Merged PRs</th>
                    <th className="py-2.5 px-4 text-right">With Test</th>
                    <th className="py-2.5 px-4 text-right">Additions</th>
                    <th className="py-2.5 pl-4 text-right">Deletions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 text-zinc-300">
                  {allStats.map((s) => (
                    <tr key={s.repo} className="hover:bg-zinc-900/40">
                      <td className="py-2.5 pr-4 font-semibold text-zinc-100">{s.name}</td>
                      <td className="py-2.5 px-4 text-zinc-400">{s.repo}</td>
                      <td className="py-2.5 px-4 text-right text-zinc-100">{s.merged}</td>
                      <td className="py-2.5 px-4 text-right text-electric-lime">
                        {s.tested}/{s.merged}
                      </td>
                      <td className="py-2.5 px-4 text-right text-zinc-200">+{s.additions}</td>
                      <td className="py-2.5 pl-4 text-right text-zinc-400">−{s.deletions}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </header>

        {/* Global Filter Bar (One Row Above Charts) */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div role="group" aria-label="Filter by project" className="flex flex-wrap gap-2">
            {[{ repo: null as string | null, name: 'All', merged: mergedPrs.length }, ...allStats].map((s) => {
              const active = selected === s.repo;
              return (
                <button
                  key={s.repo ?? 'all'}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSelected(s.repo === null ? null : s.repo === selected ? null : s.repo)}
                  className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-lime ${
                    active
                      ? 'border-electric-lime bg-electric-lime font-semibold text-zinc-950 shadow-[0_0_20px_rgba(202,255,74,0.2)]'
                      : 'border-zinc-800 bg-[#0a0a0a] text-zinc-400 hover:border-zinc-600 hover:text-zinc-100'
                  }`}
                >
                  <span>{s.name}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] tabular-nums ${
                      active ? 'bg-zinc-950/15 text-zinc-950' : 'bg-zinc-900 text-zinc-400'
                    }`}
                  >
                    {s.merged}
                  </span>
                </button>
              );
            })}
          </div>
          {selected !== null && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="font-mono text-[10px] uppercase tracking-widest text-electric-lime hover:underline"
            >
              Reset project filter
            </button>
          )}
        </div>
        <p className="sr-only" aria-live="polite">
          Showing {items.length} merged pull requests for {scope}.
        </p>

        {/* 4 Observatory Visualization Panels */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Panel title="Merged PRs by project" note={`${mergedPrs.length} total · click to filter`} index={0}>
            <ProjectBars stats={allStats} selected={selected} onSelect={toggle} metric="merged" />
          </Panel>
          <Panel title="Merges per month" note={scope} index={1}>
            <MonthlyChart items={items} />
          </Panel>
          <Panel title={`${tested} of ${items.length} ship a regression test`} note="each square opens its test" index={2}>
            <TestGrid stats={stats} items={items} />
          </Panel>
          <Panel title="Lines changed by project" note="click to filter" index={3}>
            <ProjectBars stats={allStats} selected={selected} onSelect={toggle} metric="lines" />
          </Panel>
        </div>

        {/* PR Ledger List Section */}
        <section className="mt-16" aria-labelledby="upstream-list">
          <div className="mb-6 flex flex-col gap-4 border-b border-zinc-800/70 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className={`${label} mb-2 text-electric-lime`}>Commit & test receipts</p>
              <h2
                id="upstream-list"
                className="font-display text-[clamp(1.5rem,3.5vw,2.25rem)] font-semibold leading-tight tracking-[-0.02em] text-zinc-50"
              >
                {selected ? `${projectName(selected)} · ${ledgerItems.length} merged` : `All ${ledgerItems.length} merged fixes`}
              </h2>
            </div>

            {/* Interactive Ledger Toolbar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative flex-1 sm:w-64 sm:flex-initial">
                <Search
                  size={13}
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-zinc-500"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search PR, repo, or test..."
                  aria-label="Search merged pull requests"
                  className="w-full rounded-full border border-zinc-800 bg-[#0a0a0a] py-1.5 pr-8 pl-9 font-mono text-xs text-zinc-200 placeholder:text-zinc-500 transition-colors focus:border-electric-lime focus:outline-none"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search query"
                    className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-full p-0.5 text-zinc-500 hover:text-zinc-200"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <button
                type="button"
                aria-pressed={onlyTested}
                onClick={() => setOnlyTested((v) => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-widest transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime ${
                  onlyTested
                    ? 'border-electric-lime bg-electric-lime/15 text-electric-lime'
                    : 'border-zinc-800 bg-[#0a0a0a] text-zinc-400 hover:border-zinc-600 hover:text-zinc-200'
                }`}
              >
                <Check size={11} />
                With test ({tested})
              </button>

              <div
                role="group"
                aria-label="Sort pull requests"
                className="inline-flex rounded-full border border-zinc-800 bg-[#0a0a0a] p-0.5"
              >
                <button
                  type="button"
                  aria-pressed={sortBy === 'recent'}
                  onClick={() => setSortBy('recent')}
                  className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    sortBy === 'recent' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Newest
                </button>
                <button
                  type="button"
                  aria-pressed={sortBy === 'diff'}
                  onClick={() => setSortBy('diff')}
                  className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    sortBy === 'diff' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Largest diff
                </button>
              </div>
            </div>
          </div>

          {ledgerItems.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800/70 bg-[#0a0a0a] p-12 text-center">
              <p className="font-mono text-xs uppercase tracking-widest text-zinc-400">
                No merged pull requests match the current filter.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSelected(null);
                    setQuery('');
                    setOnlyTested(false);
                  }}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-electric-lime px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-electric-lime transition-colors hover:bg-electric-lime hover:text-zinc-950"
                >
                  Reset all filters
                </button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800/70">
              {ledgerItems.map((p) => {
                const diffTotal = Math.max(1, p.additions + p.deletions);
                const addPct = Math.round((p.additions / diffTotal) * 100);
                const receipt = receiptFor(p);
                return (
                  <li
                    key={p.url}
                    className="group flex flex-col gap-4 py-5 transition-colors duration-200 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:px-3 sm:-mx-3 sm:rounded-2xl sm:hover:bg-zinc-900/35"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 font-mono text-[11px] uppercase tracking-widest text-zinc-400">
                        <span className="rounded-md border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[10px] text-zinc-200">
                          {projectName(p.repo)}
                        </span>
                        <span className="text-zinc-500">
                          {p.repo} <span className="tabular-nums text-electric-lime">#{p.number}</span>
                        </span>
                        <span className="text-zinc-700">·</span>
                        <span className="tabular-nums text-zinc-400">{monthLabel(p.mergedAt.slice(0, 7))}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="inline-flex items-center gap-2 tabular-nums">
                          <span>
                            <span className="text-zinc-200">+{p.additions}</span>{' '}
                            <span className="text-zinc-500">−{p.deletions}</span>
                          </span>
                          <span
                            aria-hidden
                            className="hidden h-1.5 w-10 items-center gap-[1px] overflow-hidden rounded-full bg-zinc-900 sm:inline-flex"
                          >
                            {p.additions > 0 && (
                              <span className="h-full bg-[#749e1b]" style={{ width: `${addPct}%` }} />
                            )}
                            {p.deletions > 0 && (
                              <span className="h-full flex-1 bg-[#d55181]" />
                            )}
                          </span>
                        </span>
                        {receipt && (
                          <span className="rounded-md border border-electric-lime/30 bg-electric-lime/10 px-2 py-0.5 text-[10px] text-electric-lime">
                            Receipt
                          </span>
                        )}
                      </div>
                      <p className="font-sans text-sm font-medium leading-relaxed text-zinc-100 transition-colors group-hover:text-white md:text-base">
                        {p.title}
                      </p>
                      {receipt && (
                        <div className="mt-2 space-y-1.5 text-sm leading-relaxed">
                          <p className="text-zinc-300">
                            <span className="inline-block w-14 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                              Issue
                            </span>{' '}
                            {receipt.issue}
                          </p>
                          <p className="text-zinc-200">
                            <span className="inline-block w-14 font-mono text-[10px] uppercase tracking-widest text-electric-lime">
                              Fix
                            </span>{' '}
                            {receipt.fix}
                          </p>
                        </div>
                      )}
                      {p.test && (
                        <p className="mt-1.5 font-mono text-[11px] text-zinc-400">
                          Proof: <span className="text-zinc-300">{p.test.label}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
                      {p.test && (
                        <a
                          href={p.test.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Regression test ${p.test.label}`}
                          className="group/btn inline-flex items-center gap-1.5 rounded-full border border-electric-lime/35 bg-electric-lime/10 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-electric-lime transition-all hover:border-electric-lime hover:bg-electric-lime hover:text-zinc-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime"
                        >
                          <span aria-hidden className="size-1.5 rounded-full bg-current" />
                          Test
                          <ArrowUpRight
                            size={12}
                            className="transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                          />
                        </a>
                      )}
                      <a
                        href={p.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group/btn inline-flex items-center gap-1.5 rounded-full border border-zinc-800 bg-[#0a0a0a] px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-300 transition-colors hover:border-electric-lime hover:text-electric-lime focus-visible:outline focus-visible:outline-2 focus-visible:outline-electric-lime"
                      >
                        PR
                        <ArrowUpRight
                          size={12}
                          className="transition-transform duration-200 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5"
                        />
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
