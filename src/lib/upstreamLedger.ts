import ledger from '../data/upstream-ledger.json';
import { upstreamReceipts, type UpstreamReceipt } from './upstream';

/** One merged upstream PR, copied from the adi-IL profile ledger by scripts/sync-ledger.mjs. */
export interface MergedPr {
  url: string;
  repo: string;
  number: number;
  title: string;
  mergedAt: string;
  additions: number;
  deletions: number;
  test: { label: string; url: string } | null;
}

export interface ProjectStat {
  repo: string;
  name: string;
  merged: number;
  tested: number;
  additions: number;
  deletions: number;
}

export interface MonthStat {
  month: string;
  label: string;
  merged: number;
}

export const TIMELINE_START = '2026-07';

const PROJECT_NAMES: Record<string, string> = {
  'tensorflow/tensorflow': 'TensorFlow',
  'google/gvisor': 'gVisor',
  'grafana/grafana': 'Grafana',
  'e2b-dev/herdr-e2b-sandbox': 'herdr E2B sandbox',
  'pvlib/pvlib-python': 'pvlib',
  'GoogleCloudPlatform/dataflow-solution-guides': 'Dataflow guides',
  'google/mug': 'Mug',
  'huggingface/peft': 'PEFT',
  'can1357/oh-my-pi': 'oh-my-pi',
  'nightly-labs/openbot': 'OpenBot',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const mergedPrs: MergedPr[] = (ledger as { items: MergedPr[] }).items;

/** A curated receipt paired with its ledger row, joined by pull request URL. */
export interface ReceiptRow {
  receipt: UpstreamReceipt;
  pr: MergedPr | null;
}

const receiptsByUrl = new Map(upstreamReceipts.map((r) => [r.url, r]));
const prsByUrl = new Map(mergedPrs.map((p) => [p.url, p]));

/** The curated receipts joined to the ledger by pull request URL. Order matches upstreamReceipts. */
export const receiptRows: ReceiptRow[] = upstreamReceipts.map((receipt) => ({
  receipt,
  pr: prsByUrl.get(receipt.url) ?? null,
}));

/** The curated receipt for a ledger row, when that PR is a curated one. */
export function receiptFor(pr: MergedPr): UpstreamReceipt | undefined {
  return receiptsByUrl.get(pr.url);
}

export function projectName(repo: string): string {
  return PROJECT_NAMES[repo] ?? repo;
}

export function monthLabel(month: string): string {
  return `${MONTHS[Number(month.slice(5, 7)) - 1]} ${month.slice(0, 4)}`;
}

/** Per-project totals, most merges first, ties by name. */
export function projectStats(items: MergedPr[]): ProjectStat[] {
  const map = new Map<string, ProjectStat>();
  for (const p of items) {
    const s = map.get(p.repo) ?? {
      repo: p.repo, name: projectName(p.repo), merged: 0, tested: 0, additions: 0, deletions: 0,
    };
    s.merged += 1;
    s.tested += p.test ? 1 : 0;
    s.additions += p.additions;
    s.deletions += p.deletions;
    map.set(p.repo, s);
  }
  return [...map.values()].sort(
    (a, b) => b.merged - a.merged || a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  );
}

/** Merges per month from TIMELINE_START through the latest merge, including empty months. */
export function monthStats(items: MergedPr[], start = TIMELINE_START): MonthStat[] {
  const last = items.reduce((m, p) => (p.mergedAt.slice(0, 7) > m ? p.mergedAt.slice(0, 7) : m), start);
  let [y, mo] = start.split('-').map(Number);
  const out: MonthStat[] = [];
  for (;;) {
    const month = `${y}-${String(mo).padStart(2, '0')}`;
    if (month > last) break;
    out.push({ month, label: monthLabel(month), merged: items.filter((p) => p.mergedAt.startsWith(month)).length });
    [y, mo] = mo === 12 ? [y + 1, 1] : [y, mo + 1];
  }
  return out;
}
