# Essay shelf

The shelf is the markdown under `src/content/articles/`. It is not a chronological blog. Keep it small. Prefer updating an existing thesis over adding a near-duplicate.

The public URL is `/articles/<slug>` (`https://www.adityaai.dev/articles/<slug>`). The UI label is Essays.

## Forms

| Form | Meaning in this repo |
| --- | --- |
| Framework | Reusable decision model |
| Architecture | System maps and comparisons |
| Principle | Standing rule |

`featured: true` is the Home "Start here" set. Keep that list short.

## Current shelf

Twelve files. Featured flags come from frontmatter.

| Slug | Form | Featured |
| --- | --- | --- |
| `the-chat-template-trap` | Architecture | yes |
| `memory-stacks-for-agents` | Framework | yes |
| `inference-economics-for-agents` | Framework | yes |
| `software-3-architecting-ai` | Architecture | yes |
| `product-is-the-model` | Principle | yes |
| `the-verification-gap` | Principle | |
| `closed-loop-remediation-architecture` | Framework | |
| `sandboxing-architectures-for-agents` | Architecture | |
| `context-circuit-breakers` | Framework | |
| `mcp-security-paradox` | Framework | |
| `ai-systems-architecture-comparison` | Architecture | |
| `six-paradigm-shifts` | Architecture | |

## File format

Path: `src/content/articles/<slug>.md`

```markdown
---
form: Framework
date: 2026-08-05
topics: [agents, memory]
featured: false
---

# Title

*Optional italic lede. Used as the SEO excerpt when it is long enough.*

## Body
```

| Field | Required | Values |
| --- | --- | --- |
| `form` | Recommended | `Framework`, `Architecture`, or `Principle` |
| `date` | Recommended | `YYYY-MM-DD` |
| `topics` | Optional | List. Used by related-essay scoring |
| `featured` | Optional | `true` only for Start here |
| `title` / `excerpt` | Optional | Override auto extraction |

If neither frontmatter `date` nor `scripts/article-dates.json` has the slug, generation uses `2026-01-01`.

## Meta generation

```bash
npm run meta
```

Also runs on `npm run dev` and as `prebuild` before `npm run build`.

`scripts/generate-articles-meta.mjs`:

1. Reads every `.md` in `src/content/articles/`
2. Parses frontmatter, first heading, excerpt
3. Estimates reading time at about 220 words per minute
4. Sorts featured first, then newest `dateISO`
5. Writes `scripts/articles-meta.json`

Do not hand-edit `articles-meta.json` for lasting changes. Edit the markdown and regenerate. CI fails if that JSON or `public/llms.txt` drifts from the committed files.

## How the client loads it

| Data | How |
| --- | --- |
| List, cards, SEO fields | Eager import of `articles-meta.json` via `src/lib/articles.ts` |
| Full body | Lazy `import.meta.glob` of that one `.md?raw` on the detail page |

Related essays (`RelatedArticles`) score other posts by same `form` (+3), overlapping `topics` (+2 each), featured (+1), then newer date, and take three.

## Projects

Projects are not markdown files. The registry is `src/lib/projects.ts`: `slug`, `name`, `tagline`, `excerpt`, `stack`, `metrics`, `liveUrl`, `codeUrl`, `ogImage`, and a long-form `content` string rendered on the project detail page.

When you add a project, `scripts/prerender.mjs` must still list the route so sitemap and prerender HTML stay in sync.

Canonical brand files for sibling sites:

1. `src/lib/projects.ts`
2. `src/components/BrandStamp.tsx`
3. `src/components/LabStrip.tsx`
4. `src/components/ProjectSignature.tsx`

## Adding an essay

1. Create `src/content/articles/your-slug.md` with frontmatter.
2. Optionally add `"your-slug": "YYYY-MM-DD"` to `scripts/article-dates.json`.
3. Run `npm run meta` or `npm run dev`.
4. Check `/articles` filters and the detail page.
5. Commit `scripts/articles-meta.json` and `public/llms.txt` with the markdown.
