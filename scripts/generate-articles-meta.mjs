/**
 * Build-time article metadata generator.
 * Parses markdown (+ YAML frontmatter) and writes scripts/articles-meta.json.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const artsDir = path.resolve(__dirname, '..', 'src', 'content', 'articles');
const datesPath = path.resolve(__dirname, 'article-dates.json');
const outPath = path.resolve(__dirname, 'articles-meta.json');

const dates = JSON.parse(fs.readFileSync(datesPath, 'utf8'));

const FORMS = new Set(['Framework', 'Architecture', 'Principle']);

function estimateReadingTime(markdown) {
  let text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/^-{3,}\s*$/gm, '')
    .replace(/[*_~>]+/g, ' ');
  const words = text.trim().split(/\s+/).filter((w) => w.length > 0).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return { minutes, words };
}

function parseFrontmatter(raw) {
  if (!raw.startsWith('---\n') && !raw.startsWith('---\r\n')) {
    return { data: {}, body: raw };
  }
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { data: {}, body: raw };
  const fm = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\r?\n/, '');
  /** @type {Record<string, string>} */
  const data = {};
  for (const line of fm.split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    data[m[1]] = val;
  }
  return { data, body };
}

function parseTopics(raw) {
  if (!raw) return [];
  const inner = raw.replace(/^\[/, '').replace(/\]$/, '');
  return inner
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function formatDisplayDate(iso) {
  const d = new Date(`${iso}T12:00:00Z`);
  return d
    .toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    })
    .toUpperCase();
}

function stripInlineMd(s) {
  return s
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function clipExcerpt(text, max = 200) {
  if (text.length <= max) return text;
  const clipped = text.slice(0, max - 1).replace(/\s+\S*$/, '');
  return `${clipped}…`;
}

function extractExcerpt(body) {
  const lines = body.split(/\r?\n/);
  let foundTitle = false;
  /** @type {string[]} */
  const candidates = [];

  for (const line of lines) {
    if (line.startsWith('# ')) {
      foundTitle = true;
      continue;
    }
    if (!foundTitle) continue;

    const t = line.trim();
    if (!t) continue;
    if (/^#{1,6}\s/.test(t)) continue;
    if (/^-{3,}$/.test(t)) continue;
    if (/^\|/.test(t)) continue;
    if (/^[-+]\s+/.test(t)) continue;
    if (/^\*\s+/.test(t)) continue;

    const italicOnly = t.match(/^\*([^*][\s\S]*?)\*$/);
    if (italicOnly) {
      const cleaned = stripInlineMd(italicOnly[1]);
      if (cleaned) candidates.push(cleaned);
      if (cleaned.length >= 100) break;
      continue;
    }

    if (t.startsWith('>')) {
      const cleaned = stripInlineMd(t.replace(/^>\s?/, ''));
      if (cleaned) candidates.push(cleaned);
      if (cleaned.length >= 80) break;
      continue;
    }

    const cleaned = stripInlineMd(t);
    if (!cleaned) continue;
    candidates.push(cleaned);
    if (cleaned.length >= 80) break;
  }

  if (candidates.length === 0) return '';
  const preferred =
    candidates.find((c) => c.length >= 100) ||
    candidates.find((c) => c.length >= 60) ||
    [...candidates].sort((a, b) => b.length - a.length)[0] ||
    '';
  return clipExcerpt(preferred, 200);
}

function inferForm(title) {
  const t = title.toLowerCase();
  if (/(framework|stack|economics|paradox|pillars)/i.test(t)) return 'Framework';
  if (/(principle|product is|sticky)/i.test(t)) return 'Principle';
  if (/(architect|paradigm|comparison|software 3|beyond)/i.test(t)) return 'Architecture';
  return 'Framework';
}

const articles = fs
  .readdirSync(artsDir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const slug = f.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(artsDir, f), 'utf8');
    const { data, body } = parseFrontmatter(raw);
    const titleMatch = body.match(/^#\s+(.*)/m);
    const title = data.title || (titleMatch ? titleMatch[1] : slug.replace(/-/g, ' '));

    const excerpt = data.excerpt
      ? clipExcerpt(stripInlineMd(data.excerpt), 200)
      : extractExcerpt(body);

    let dateISO = data.date || dates[slug];
    if (!dateISO || !/^\d{4}-\d{2}-\d{2}$/.test(dateISO)) {
      dateISO = '2026-01-01';
    }

    const formRaw = data.form || data.category || '';
    const form = FORMS.has(formRaw) ? formRaw : inferForm(title);
    const topics = parseTopics(data.topics);
    const featured = data.featured === 'true' || data.featured === true;

    const { minutes: readingTime, words: wordCount } = estimateReadingTime(body);

    return {
      slug,
      title,
      excerpt,
      dateISO,
      date: formatDisplayDate(dateISO),
      form,
      /** @deprecated use form — kept as alias for older consumers during transition */
      category: form,
      topics,
      featured,
      readingTime,
      wordCount,
    };
  })
  .sort((a, b) => {
    // Featured first, then newest publish date
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    const byDate = b.dateISO.localeCompare(a.dateISO);
    if (byDate !== 0) return byDate;
    return a.slug.localeCompare(b.slug);
  });

fs.writeFileSync(outPath, JSON.stringify(articles, null, 2) + '\n');
console.log(`✅ Generated articles-meta.json (${articles.length} essays)`);
articles.forEach((a) =>
  console.log(`  ${a.featured ? '★' : '·'} [${a.form}] ${a.slug}`),
);
