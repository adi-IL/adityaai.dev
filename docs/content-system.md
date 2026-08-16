# Content system

## Essay shelf policy

- **Small shelf, high signal** - not a chronological blog dump.
- Each piece should change how a systems designer decides something (memory, cost, MCP, product surface, architecture).
- Taxonomy (UI filters): **Framework · Architecture · Principle**.
- Restart snapshot: **7 essays** (see `src/content/articles/`).

### Current shelf (slugs)

| Slug | Form | Featured |
| --- | --- | --- |
| `memory-stacks-for-agents` | Framework | ★ |
| `inference-economics-for-agents` | Framework | ★ |
| `software-3-architecting-ai` | Architecture | ★ |
| `product-is-the-model` | Principle | ★ |
| `mcp-security-paradox` | Framework | |
| `ai-systems-architecture-comparison` | Architecture | |
| `six-paradigm-shifts` | Architecture | |

URLs: `/articles/<slug>` → public `https://www.adityaai.dev/articles/<slug>`.

---

## File format

Path: `src/content/articles/<slug>.md`

```markdown
---
form: Framework
date: 2026-04-16
topics: [agents, memory]
featured: true
---

# Title

*Optional italic lede - preferred for SEO excerpt when long enough.*

## Sections…
```

| Field | Required | Values |
| --- | --- | --- |
| `form` | Recommended | `Framework` \| `Architecture` \| `Principle` |
| `date` | Recommended | `YYYY-MM-DD` |
| `topics` | Optional | List for related-essay scoring |
| `featured` | Optional | `true` only for “Start here” (keep few) |
| `title` / `excerpt` | Optional | Override auto extraction |

Optional fallback dates: `scripts/article-dates.json` keyed by slug (if neither frontmatter date nor JSON override exists, generation defaults to `2026-01-01`).

---

## Meta generation

```bash
npm run meta
# also runs on npm run dev / npm run build (prebuild)
```

`scripts/generate-articles-meta.mjs`:

1. Reads all `.md` under `src/content/articles/`
2. Parses frontmatter + first heading + excerpt heuristic
3. Estimates reading time (~220 wpm)
4. Sorts: **featured first**, then newest `dateISO`
5. Writes `scripts/articles-meta.json`

**Do not hand-edit `articles-meta.json`** for lasting changes - edit markdown / frontmatter and regenerate.

---

## Client loading model

| Data | How |
| --- | --- |
| List / cards / SEO fields | Eager import of `articles-meta.json` |
| Full body | Lazy `import.meta.glob` of that one `.md?raw` on detail page |

Keeps initial JS smaller as the shelf grows.

---

## Related essays

`RelatedArticles` scores other posts by:

1. Same `form`
2. Overlapping `topics`
3. Featured boost  
then date.

---

## Projects content

Not markdown files. Primary registry is **`src/lib/projects.ts`**:

- `slug`, `name`, `tagline`, `excerpt`, `stack`, `metrics`
- `liveUrl`, `codeUrl`, `ogImage`
- Long-form `content` string (markdown rendered on project detail)

Note: when adding a project, also verify the metadata listing in `scripts/prerender.mjs` matches for route prerendering and sitemap generation.

---

## Prerender & discovery files

After Vite build, `scripts/prerender.mjs`:

| Output | Role |
| --- | --- |
| `dist/<page>/index.html` | Route-specific meta for crawlers |
| `dist/sitemap.xml` | All public routes + lastmod |
| `dist/llms.txt` + `public/llms.txt` | LLM-oriented site summary |

Canonical host in generated markup: **`https://www.adityaai.dev`**.

---

## Adding a new essay (checklist)

1. Create `src/content/articles/your-slug.md` with frontmatter.
2. Optionally add date to `scripts/article-dates.json`.
3. Run `npm run meta` or `npm run build`.
4. Check `/articles` filters and detail page locally.
5. Commit and push (or `vercel --prod`).

Prefer updating an existing thesis over adding near-duplicates. Keep `featured: true` rare.
