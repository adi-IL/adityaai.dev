<div align="center">

# adityaai.dev

**Root site for the adityaai.dev lab.**

Decision tools for people who design production AI systems — plus the control
surface for [FRIDAY](https://friday.adityaai.dev),
[Sentinel](https://sentinel.adityaai.dev), and
[OpalServe](https://opalserve.adityaai.dev).

</div>

---

## What this site is

| Surface | Purpose |
| --- | --- |
| **Essays** (`/articles`) | Small curated shelf (not a blog firehose). Frameworks, architecture maps, and principles. |
| **Projects** (`/projects`) | Lab products: write-ups, metrics, live URLs, source. |
| **About** | Bio, certifications, positioning. |
| **Newsletter** | Double opt-in via Resend (confirm link → contact + welcome). |
| **Virtual coffee** | Lead form → notify you + confirm visitor. |

**North star for essays:** each piece should change how someone architects agents, memory, cost, security, or the product surface. If it only works as a weekly score update, it does not belong on the shelf.

---

## Essay shelf (current)

Seven essays after a 2026-08 reset. Forms:

| Form | Meaning |
| --- | --- |
| **Framework** | Reusable decision model (memory stacks, inference economics, MCP security). |
| **Architecture** | Maps of how systems are structured (Software 3.0, paradigm shifts, comparisons). |
| **Principle** | Standing rules (product is the model). |

| ★ Start here | Slug | Form |
| --- | --- | --- |
| ★ | [`memory-stacks-for-agents`](https://www.adityaai.dev/articles/memory-stacks-for-agents) | Framework |
| ★ | [`inference-economics-for-agents`](https://www.adityaai.dev/articles/inference-economics-for-agents) | Framework |
| ★ | [`software-3-architecting-ai`](https://www.adityaai.dev/articles/software-3-architecting-ai) | Architecture |
| ★ | [`product-is-the-model`](https://www.adityaai.dev/articles/product-is-the-model) | Principle |
| | [`mcp-security-paradox`](https://www.adityaai.dev/articles/mcp-security-paradox) | Framework |
| | [`ai-systems-architecture-comparison`](https://www.adityaai.dev/articles/ai-systems-architecture-comparison) | Architecture |
| | [`six-paradigm-shifts`](https://www.adityaai.dev/articles/six-paradigm-shifts) | Architecture |

Route stays `/articles` for stability; UI labels say **Essays**.

### Adding an essay

1. Create `src/content/articles/your-slug.md`:

```markdown
---
form: Framework
date: 2026-08-05
topics: [agents, memory]
featured: false
---

# Clear title

*One-paragraph lede (italic is used as the SEO excerpt when strong enough).*

## Body…
```

2. Optionally add `"your-slug": "YYYY-MM-DD"` to `scripts/article-dates.json` (frontmatter `date` is enough if present).
3. Run `npm run meta` or just `npm run dev` / `npm run build` (meta regenerates automatically).

| Frontmatter | Values |
| --- | --- |
| `form` | `Framework` · `Architecture` · `Principle` |
| `date` | `YYYY-MM-DD` |
| `topics` | `[topic, …]` for related essays |
| `featured` | `true` only for **Start here** (keep few) |

Keep the shelf small. Prefer updating a thesis in place over publishing a near-duplicate.

---

## The lab

| Project | Live | Source | One-line |
| --- | --- | --- | --- |
| **FRIDAY** | [friday.adityaai.dev](https://friday.adityaai.dev) | [friday-visual-engine](https://github.com/adityaidev/friday-visual-engine) | Generative 3D engineering visualization |
| **Sentinel** | [sentinel.adityaai.dev](https://sentinel.adityaai.dev) | [sentinel](https://github.com/adityaidev/sentinel) | Multi-agent competitive intelligence |
| **OpalServe** | [opalserve.adityaai.dev](https://opalserve.adityaai.dev) | [opalserve](https://github.com/adityaidev/opalserve) | MCP registry and team gateway |

### Shared brand (do not fork)

Canonical files for sibling sites:

1. `src/lib/projects.ts` — project registry  
2. `src/components/BrandStamp.tsx` — cross-site mark  
3. `src/components/LabStrip.tsx` — footer ribbon  
4. `src/components/ProjectSignature.tsx` — per-project signatures  

Mirror these into friday / sentinel / opalserve when they change.

---

## Stack

React 19 · React Router · TypeScript · Vite · Tailwind 4 · Motion · Vercel · Resend.

| Path | Role |
| --- | --- |
| `src/` | SPA UI |
| `src/content/articles/` | Essay markdown |
| `lib/` | Shared API logic (rate limit, email, double opt-in) |
| `api/` | Vercel serverless entrypoints |
| `server.ts` | Local Express + Vite middleware |
| `scripts/` | Article meta generator + prerender / sitemap / `llms.txt` |

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill RESEND_API_KEY
npm run dev                  # regenerates article meta, then serves on :3000
```

Node.js 20+.

| Script | What it does |
| --- | --- |
| `npm run dev` | Meta + Express/Vite dev server |
| `npm run build` | Meta → Vite build → prerender HTML + sitemap + `llms.txt` |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | Unit tests (rate limit, email helpers, confirm tokens) |
| `npm run meta` | Regenerate `scripts/articles-meta.json` only |

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | For email APIs | Newsletter, feedback, virtual coffee |
| `RESEND_AUDIENCE_ID` | Recommended | Segment/audience for confirmed subscribers |
| `SUBSCRIBE_SECRET` | No | HMAC for confirm links (defaults to `RESEND_API_KEY`) |
| `APP_URL` | No | Origin in confirm emails (default `https://www.adityaai.dev`) |
| `NOTIFY_EMAIL` | No | Your inbox for leads / feedback / confirmed subs |
| `PORT` | No | Local server port (default `3000`) |

**Newsletter:** double opt-in only. `POST /api/subscribe` sends a confirm email; welcome + Resend contact run after `GET /api/subscribe/confirm?token=…`. Honeypot + rate limits apply; no CAPTCHA.

---

## Deploy notes

- Production is **Vercel** static output (`dist/`) + `api/*` functions.
- Prerender writes SEO HTML per route, `sitemap.xml`, and refreshes `public/llms.txt`.
- Canonical host: **`https://www.adityaai.dev`**.

---

## License / ownership

Private portfolio (`"private": true` in `package.json`). Content and brand are Aditya Gaurav / adityaai.dev lab.
