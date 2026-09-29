import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { guardHits, GUARD_TERMS } from '../scripts/upstream-guard.mjs';
import { normalize } from '../scripts/sync-ledger.mjs';
import { mergedPrs, monthStats, projectStats, TIMELINE_START, type MergedPr } from '../src/lib/upstreamLedger.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

function pr(over: Partial<MergedPr>): MergedPr {
  return {
    url: 'https://github.com/a/b/pull/1', repo: 'a/b', number: 1, title: 't',
    mergedAt: '2026-09-01T00:00:00Z', additions: 1, deletions: 1, test: null, ...over,
  };
}

describe('upstream guard', () => {
  it('holds the four profile terms', () => {
    assert.equal(GUARD_TERMS.length, 4);
  });

  it('catches banned names in any spelling, and the DataHub PR in both forms', () => {
    for (const s of ['FRIDAY', 'F.R.I.D.A.Y', 'friday.adityaai.dev', 'Sentinel', 'SENTINEL',
      'datahub-skills#88', 'https://github.com/datahub-project/datahub-skills/pull/88']) {
      assert.ok(guardHits(s).length > 0, s);
    }
    assert.deepEqual(guardHits('TensorFlow gVisor Grafana MidSphere'), []);
  });

  it('passes on the synced data and every /upstream source file', () => {
    for (const f of ['src/data/upstream-ledger.json', 'src/pages/Upstream.tsx', 'src/lib/upstreamLedger.ts']) {
      assert.deepEqual(guardHits(read(f)), [], f);
    }
  });

  it('keeps approval wording off the page', () => {
    for (const f of ['src/data/upstream-ledger.json', 'src/pages/Upstream.tsx', 'src/lib/upstreamLedger.ts']) {
      assert.ok(!/approv/i.test(read(f)), f);
    }
  });
});

describe('sync-ledger normalize', () => {
  const good = {
    url: 'https://github.com/a/b/pull/7', repo: 'a/b', number: 7, title: 'fix', merged_at: '2026-08-02T00:00:00Z',
    merge_oid: 'a'.repeat(40), additions: 3, deletions: 1, approvers: ['x'],
    proof: { label: 'testX', url: 'https://github.com/a/b/blob/x/t.py#L1', path: 't.py', line: 1 },
  };

  it('keeps merged entries and only the fields the page needs', () => {
    const out = normalize({ items: [good] });
    assert.deepEqual(Object.keys(out.items[0]).sort(),
      ['additions', 'deletions', 'mergedAt', 'number', 'repo', 'test', 'title', 'url']);
    assert.deepEqual(out.items[0].test, { label: 'testX', url: good.proof.url });
  });

  it('drops entries without a merge commit or with a mismatched URL', () => {
    const out = normalize({ items: [
      { ...good, merge_oid: null },
      { ...good, merged_at: null },
      { ...good, number: 8 },
      { ...good, url: 'https://example.com/a/b/pull/7' },
    ] });
    assert.equal(out.items.length, 0);
  });
});

describe('upstream stats', () => {
  it('match the synced ledger', () => {
    const stats = projectStats(mergedPrs);
    assert.equal(stats.reduce((n, s) => n + s.merged, 0), mergedPrs.length);
    assert.equal(stats.reduce((n, s) => n + s.tested, 0), mergedPrs.filter((p) => p.test).length);
    for (const s of stats) {
      const mine = mergedPrs.filter((p) => p.repo === s.repo);
      assert.equal(s.merged, mine.length);
      assert.equal(s.additions, mine.reduce((n, p) => n + p.additions, 0));
      assert.equal(s.deletions, mine.reduce((n, p) => n + p.deletions, 0));
    }
    const months = monthStats(mergedPrs);
    assert.equal(months[0].month, TIMELINE_START);
    assert.equal(months.reduce((n, m) => n + m.merged, 0), mergedPrs.length);
  });

  it('orders projects by merges and fills empty months', () => {
    const items = [
      pr({ repo: 'x/y', url: 'https://github.com/x/y/pull/1', mergedAt: '2026-09-03T00:00:00Z', test: { label: 'l', url: 'u' } }),
      pr({ repo: 'x/y', url: 'https://github.com/x/y/pull/2', mergedAt: '2026-09-04T00:00:00Z' }),
      pr({}),
    ];
    const stats = projectStats(items);
    assert.deepEqual(stats.map((s) => [s.repo, s.merged, s.tested]), [['x/y', 2, 1], ['a/b', 1, 0]]);
    assert.deepEqual(monthStats(items).map((m) => [m.month, m.merged]), [['2026-07', 0], ['2026-08', 0], ['2026-09', 3]]);
  });
});

describe('upstream tooltips stay inside a narrow viewport', () => {
  it('pins edge-column tooltips to their edge and caps every width to the viewport', async () => {
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { HelmetProvider } = await import('react-helmet-async');
    const { default: Upstream } = await import('../src/pages/Upstream.tsx');
    const html = renderToStaticMarkup(createElement(HelmetProvider, null, createElement(Upstream)));
    const tips = [...html.matchAll(/<span role="tooltip" class="([^"]*)"/g)].map((m) => m[1]);
    assert.ok(tips.length > 0);
    for (const c of tips) assert.match(c, /max-w-\[min\(16rem,calc\(100vw-3rem\)\)\]/);

    const monthTips = [...html.matchAll(/data-month="[^"]*"[^>]*>(?:(?!data-month)[\s\S])*?<span role="tooltip" class="([^"]*)"/g)].map((m) => m[1]);
    assert.equal(monthTips.length, monthStats(mergedPrs).length);
    assert.match(monthTips[0], /\bleft-0\b/);
    assert.match(monthTips.at(-1)!, /\bright-0\b/);
    assert.doesNotMatch(monthTips.at(-1)!, /translate-x/);
  });
});
