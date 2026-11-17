import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { guardHits } from '../scripts/upstream-guard.mjs';
import { normalize } from '../scripts/sync-ledger.mjs';
import { mergedPrs, monthStats, projectName, projectStats, type MergedPr } from '../src/lib/upstreamLedger.ts';
import { articles, loadArticle } from '../src/lib/articles.ts';
import { buildSiteContext } from '../lib/site-context.js';
import { projects } from '../src/lib/projects.js';
import { upstreamReceipts } from '../src/lib/upstream.ts';

const read = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

/** The five characters React escapes in text content. */
const escapeText = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

function pr(over: Partial<MergedPr>): MergedPr {
  return {
    url: 'https://github.com/a/b/pull/1', repo: 'a/b', number: 1, title: 't',
    mergedAt: '2026-09-01T00:00:00Z', additions: 1, deletions: 1, test: null, ...over,
  };
}

describe('upstream guard', () => {
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

  it('maps every repository in the synced ledger to a friendly display name', () => {
    for (const item of mergedPrs) {
      const name = projectName(item.repo);
      assert.ok(!name.includes('/'), `unmapped repo slug: ${item.repo}`);
    }
  });
});

describe('site context', () => {
  it('includes every project from the registry and the /upstream page', () => {
    const context = buildSiteContext();
    for (const p of projects) {
      assert.ok(context.includes(p.name), `missing project name: ${p.name}`);
      assert.ok(context.includes(p.tagline), `missing project tagline: ${p.tagline}`);
      assert.ok(context.includes(p.excerpt), `missing project excerpt: ${p.excerpt}`);
    }
    assert.ok(context.includes('https://www.adityaai.dev/upstream'), 'missing /upstream page');
    assert.ok(
      context.includes(`UPSTREAM LEDGER (${mergedPrs.length} merged open-source PRs`),
      'missing upstream ledger summary in site context',
    );
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

describe('articles loader', () => {
  it('loads valid metadata and full markdown bodies for every essay without typeof import.meta.glob', async () => {
    assert.ok(articles.length > 0);
    for (const meta of articles) {
      assert.ok(meta.slug.length > 0);
      assert.ok(meta.title.length > 0);
      assert.ok(meta.excerpt.length > 0);
      assert.ok(meta.readingTime > 0);
      assert.ok(meta.wordCount > 0);
      const article = await loadArticle(meta.slug);
      assert.ok(article, `loadArticle(${meta.slug}) returned null`);
      assert.ok(article.content.length > 0, `empty body for ${meta.slug}`);
      assert.ok(!article.content.startsWith('---\n'), `unstripped frontmatter for ${meta.slug}`);
    }
    assert.equal(await loadArticle('non-existent-slug'), null);

    const src = read('src/lib/articles.ts');
    assert.ok(!src.includes('typeof import.meta.glob'), 'src/lib/articles.ts must not gate import.meta.glob with typeof');
  });
});


describe('projects receipts', () => {
  it('only features merged PRs from the ledger, each listed in llms.txt', async () => {
    const { upstreamReceipts } = await import('../src/lib/upstream.ts');
    const merged = new Set(mergedPrs.map((p) => p.url));
    const llms = read('public/llms.txt');
    assert.ok(upstreamReceipts.length > 0);
    for (const r of upstreamReceipts) {
      assert.equal(r.url, `https://github.com/${r.org}/${r.repo}/pull/${r.pr}`);
      assert.ok(merged.has(r.url), `${r.url} is not a merged ledger entry`);
      assert.ok(llms.includes(`- ${r.org}/${r.repo}#${r.pr} - ${r.short}`), `${r.url} missing from llms.txt`);
      assert.deepEqual(guardHits(`${r.issue} ${r.fix} ${r.short}`), [], r.url);
    }
  });
});

describe('receipt strip on /projects', () => {
  it('renders one summary line per receipt, links its row, and keeps the Issue and Fix prose off the page', async () => {
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { MemoryRouter } = await import('react-router-dom');
    const { HelmetProvider } = await import('react-helmet-async');
    const { MotionConfig } = await import('motion/react');
    const { default: Projects } = await import('../src/pages/Projects.tsx');

    const html = renderToStaticMarkup(
      createElement(
        HelmetProvider,
        null,
        createElement(MemoryRouter, null, createElement(MotionConfig, null, createElement(Projects))),
      ),
    );

    for (const r of upstreamReceipts) {
      assert.ok(html.includes(escapeText(r.short)), `${r.url} summary missing from /projects`);
      assert.ok(!html.includes(escapeText(r.issue)), `${r.url} Issue prose leaked onto /projects`);
      assert.ok(!html.includes(escapeText(r.fix)), `${r.url} Fix prose leaked onto /projects`);
      assert.ok(html.includes(`href="${r.url}"`), `${r.url} row does not link to the pull request`);
    }
  });
});

describe('receipt account on /upstream', () => {
  it('carries the Issue and Fix prose on the matching ledger rows', async () => {
    const { createElement } = await import('react');
    const { renderToStaticMarkup } = await import('react-dom/server');
    const { HelmetProvider } = await import('react-helmet-async');
    const { default: Upstream } = await import('../src/pages/Upstream.tsx');

    const html = renderToStaticMarkup(createElement(HelmetProvider, null, createElement(Upstream)));

    for (const r of upstreamReceipts) {
      assert.ok(html.includes(escapeText(r.issue)), `${r.url} Issue prose missing from /upstream`);
      assert.ok(html.includes(escapeText(r.fix)), `${r.url} Fix prose missing from /upstream`);
    }
  });
});
