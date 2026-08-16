<div align="center">

# adityaai.dev

**Root site for the adityaai lab.**

Decision tools for people who design production AI systems - plus the control
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
| **Newsletter** | Double opt-in via Resend (confirm link -> contact + welcome). |
| **Virtual coffee** | Lead form -> notify you + confirm visitor. |
| **Lab guide** | Floating chat (`/api/chat`) - Vertex/Gemini, site-first. |

**North star for essays:** each piece should change how someone architects agents, memory, cost, security, or the product surface. If it only works as a weekly score update, it does not belong on the shelf.

**Deep architecture docs:** [docs/README.md](./docs/README.md) (system map, deployment locations, flows, APIs).

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

## Body...
```

2. Optionally add `"your-slug": "YYYY-MM-DD"` to `scripts/article-dates.json` (frontmatter `date` is enough if present).
3. Run `npm run meta` or just `npm run dev` / `npm run build` (meta regenerates automatically).

| Frontmatter | Values |
| --- | --- |
| `form` | `Framework` · `Architecture` · `Principle` |
| `date` | `YYYY-MM-DD` |
| `topics` | `[topic, ...]` for related essays |
| `featured` | `true` only for **Start here** (keep few) |

Keep the shelf small. Prefer updating a thesis in place over publishing a near-duplicate.

---

## The lab

| Project | Live | Source | One-line |
| --- | --- | --- | --- |
| **FRIDAY** | [friday.adityaai.dev](https://friday.adityaai.dev) | [friday-visual-engine](https://github.com/adi-IL/friday-visual-engine) | Immersive Engineering Visual Intelligence |
| **Sentinel** | [sentinel.adityaai.dev](https://sentinel.adityaai.dev) | [sentinel](https://github.com/adi-IL/sentinel) | Autonomous Competitive Intelligence |
| **OpalServe** | [opalserve.adityaai.dev](https://opalserve.adityaai.dev) | [opalserve](https://github.com/adi-IL/opalserve) | The control plane for your team's AI tools |

### Shared brand (do not fork)

Canonical files for sibling sites:

1. `src/lib/projects.ts` - project registry
2. `src/components/BrandStamp.tsx` - cross-site mark
3. `src/components/LabStrip.tsx` - footer ribbon
4. `src/components/ProjectSignature.tsx` - per-project signatures

Mirror these into friday / sentinel / opalserve when they change.

---

## Stack

React 19 · React Router · TypeScript · Vite · Tailwind 4 · Motion · Vercel · Resend · Vertex AI (Gemini).

| Path | Role |
| --- | --- |
| `src/` | SPA UI (includes floating **Lab guide** chat) |
| `src/content/articles/` | Essay markdown |
| `lib/` | Shared API logic (rate limit, email, chat, Vertex client) |
| `api/` | Vercel serverless entrypoints (`/api/chat`, subscribe, coffee, ...) |
| `server.ts` | Local Express + Vite middleware |
| `scripts/` | Article meta generator + prerender / sitemap / `llms.txt` |
| `tests/` | Node-native unit tests (`tsx --test`) |
| `.github/workflows/` | CI gate (typecheck, tests, build) |

### Lab guide chatbot

Floating widget (bottom-right) answers questions about the essay shelf and lab projects.

- **API:** `POST /api/chat` with `{ messages: [{ role, content }] }`
- **Model:** Gemini via `@google/genai` - **same auth pattern as `sentinel-main`**
- **Context:** essay meta + project registry (site-first system prompt)
- **Web research:** optional Google Search grounding when `CHAT_ENABLE_SEARCH=true`

**Auth order (identical to Sentinel `api/_shared/gemini.ts`):**

1. `GEMINI_API_KEY` / `GOOGLE_API_KEY` -> Google AI Studio
2. Else Vertex: write `GCP_CREDENTIALS_JSON` to `/tmp/gcp_adc.json`, set `GOOGLE_APPLICATION_CREDENTIALS`, then
   `new GoogleGenAI({ vertexai: true, project: GCP_PROJECT_ID, location: GCP_LOCATION })`

**Vercel env (mirror `sentinel-main` Production):**

| Name | Notes |
| --- | --- |
| `GCP_PROJECT_ID` | Same project as Sentinel |
| `GCP_LOCATION` | e.g. `us-central1` |
| `GCP_CREDENTIALS_JSON` | Full service-account JSON (sensitive). Copy from Sentinel -> adityaai.dev in the Vercel dashboard (CLI cannot re-export encrypted secrets). |

Aliases `GOOGLE_CLOUD_*` / `GOOGLE_SERVICE_ACCOUNT_JSON` also work. Local dev can use ADC instead of the JSON.

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill RESEND_API_KEY
npm run dev                  # regenerates article meta, then serves on :3000
```

Node.js 20+ (CI runs 20 / 22 / 24; Vercel production runs Node 24).

`server.ts` loads env from `.env.local` then `.env` (in that order), so keep personal overrides in `.env.local` and shared defaults in `.env`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Meta + Express/Vite dev server |
| `npm run start` | Express only (serves `dist/`; run `npm run build` first) |
| `npm run build` | Meta -> Vite build -> prerender HTML + sitemap + `llms.txt` |
| `npm run preview` | Vite preview (preview production build locally) |
| `npm run clean` | Clean build artifacts (`rm -rf dist`) |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | Unit tests (rate limit, email helpers, confirm tokens, errors, handlers) |
| `npm run meta` | Regenerate `scripts/articles-meta.json` only |

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | For email APIs | Newsletter, feedback, virtual coffee |
| `RESEND_AUDIENCE_ID` | Recommended | Segment/audience for confirmed subscribers |
| `SUBSCRIBE_SECRET` | No | HMAC for confirm links (defaults to `RESEND_API_KEY`) |
| `APP_URL` | No | Origin in confirm emails (default `https://www.adityaai.dev`) |
| `NOTIFY_EMAIL` | No | Your inbox for leads / feedback / confirmed subs (default `aiexpert@adityaai.dev`) |
| `GCP_PROJECT_ID` | For Vertex chat | Same as Sentinel |
| `GCP_LOCATION` | No | Default `us-central1` |
| `GCP_CREDENTIALS_JSON` | Prod Vertex | SA JSON string (copy from Sentinel dashboard) |
| `GEMINI_API_KEY` | Optional | Skips Vertex if set (AI Studio) |
| `GEMINI_MODEL` | No | Default `gemini-3.7-flash` |
| `CHAT_ENABLE_SEARCH` | No | Default `true` |
| `PORT` | No | Local server port (default `3000`) |

**Newsletter:** double opt-in only. `POST /api/subscribe` sends a confirm email; welcome + Resend contact run after `GET /api/subscribe/confirm?token=...`. Honeypot + rate limits apply; no CAPTCHA.

---

## Deploy notes

- Production is **Vercel** static output (`dist/`) + `api/*` functions.
- Pushes to `main` are gated by CI (typecheck + tests + build), then deployed by the Vercel Git integration.
- Prerender writes SEO HTML per route, `sitemap.xml`, and refreshes `public/llms.txt`.
- Canonical host: **`https://www.adityaai.dev`**.
- Secrets live in Vercel env (never in the client bundle). After changing env vars, redeploy.

See [docs/deployment.md](./docs/deployment.md) for the full operator guide.

---

## License / ownership

Private portfolio (`"private": true` in `package.json`). Content and brand are Aditya Gaurav / adityaai.dev lab.
