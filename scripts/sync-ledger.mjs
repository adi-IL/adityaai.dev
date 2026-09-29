// Copy the merged-PR ledger from the adi-IL profile repo into src/data/upstream-ledger.json.
// Source: LEDGER_SRC (a file path or URL), default the profile repo's main branch.
// Keeps only merged, well-formed entries and refuses to write if the guard finds a banned term.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { guardHits } from './upstream-guard.mjs';

export const DEFAULT_SRC = 'https://raw.githubusercontent.com/adi-IL/adi-IL/main/data/ledger.json';
const PR_URL = /^https:\/\/github\.com\/([\w.-]+)\/([\w.-]+)\/pull\/(\d+)$/;
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data', 'upstream-ledger.json');

export function normalize(ledger) {
  const items = [];
  for (const p of ledger.items ?? []) {
    const m = PR_URL.exec(p.url ?? '');
    if (!m || `${m[1]}/${m[2]}` !== p.repo || Number(m[3]) !== p.number) continue;
    if (!p.merged_at || !/^[0-9a-f]{40}$/.test(p.merge_oid ?? '')) continue;
    items.push({
      url: p.url,
      repo: p.repo,
      number: p.number,
      title: p.title,
      mergedAt: p.merged_at,
      additions: p.additions,
      deletions: p.deletions,
      test: p.proof ? { label: p.proof.label, url: p.proof.url } : null,
    });
  }
  items.sort((a, b) => b.mergedAt.localeCompare(a.mergedAt) || a.url.localeCompare(b.url));
  return { source: 'adi-IL/adi-IL data/ledger.json', items };
}

async function load(src) {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`fetch ${src}: HTTP ${res.status}`);
    return res.json();
  }
  return JSON.parse(await readFile(src, 'utf8'));
}

async function main() {
  const src = process.env.LEDGER_SRC || DEFAULT_SRC;
  const data = normalize(await load(src));
  const text = JSON.stringify(data, null, 2) + '\n';
  if (guardHits(text).length) {
    console.error('sync-ledger: banned term found, nothing written');
    process.exit(1);
  }
  await writeFile(OUT, text);
  console.log(`sync-ledger: wrote ${data.items.length} merged PRs from ${src}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`sync-ledger: ${err.message}`);
    process.exit(1);
  });
}
