# Architecture

adityaai.dev is the root site of the adityaai lab: thirteen essays, a three-project registry, About, Upstream, newsletter, virtual coffee, article feedback, C2H support reports, and the lab guide chat.

Sibling products live on their own hosts. This repo is the brand home and the control surface.

## Shape

```
Browser (SPA)
  React 19, React Router 7, Tailwind 4, Motion
  Pages, SEO, floating chat, virtual coffee
        │ HTTPS
        ▼
Vercel
  Static CDN: dist/ HTML, JS, CSS, prerendered routes, sitemap, robots, llms.txt
  Serverless: api/*.ts → lib/handlers/*
        │
        ├── Resend (newsletter, coffee, feedback, c2h-report)
        ├── Vertex AI / Gemini (lab guide)
        └── Google Search grounding (optional, when CHAT_ENABLE_SEARCH)
```

## Runtime modes

| Mode | Entry | Frontend | APIs |
| --- | --- | --- | --- |
| Local | `npm run dev` → `tsx server.ts` | Vite middleware (HMR) | Same handlers via Express |
| Production | Vercel | Files from `dist/` | Vercel serverless `api/*.ts` |

Shared logic lives in `lib/` so Express and Vercel stay thin wrappers.

## Layout

```
api/                      Vercel entrypoints (thin)
  c2h-report.ts
  chat.ts
  feedback.ts
  subscribe.ts
  subscribe/confirm.ts
  virtual-coffee.ts
lib/                      Shared server logic
  handlers/               chat.ts, subscribe.ts, feedback.ts, virtual-coffee.ts, c2h-report.ts
  vertex.ts               Gemini / Vertex client
  site-context.ts         Chat system prompt
  email.ts, errors.ts, http.ts, rate-limit.ts
  subscribe-token.ts      Double opt-in HMAC
src/                      React SPA
  App.tsx, main.tsx, index.css
  pages/                  Home.tsx, Articles.tsx, ArticleDetail.tsx, Projects.tsx, ProjectDetail.tsx, About.tsx, Upstream.tsx, NotFound.tsx
  components/
  content/articles/       Essay markdown
  data/                   upstream-ledger.json
  hooks/                  useScrolledPast.ts
  lib/                    articles.ts, projects.ts, upstream.ts, upstreamLedger.ts, gpu/
scripts/
  generate-articles-meta.mjs
  articles-meta.json
  article-dates.json
  prerender.mjs
  sync-ledger.mjs
  upstream-guard.mjs
public/                   robots.txt, 404.html, llms.txt, c2-h.ps1, c2-h.sh, .well-known/security.txt
tests/
.github/workflows/ci.yml
server.ts                 Local Express + Vite
vercel.json               Redirects, rewrites, security headers, cache
docs/
```

## Frontend

`main.tsx` mounts `App.tsx`: router, `ScrollToTop`, `LazyMotion`, `GlobalBackgrounds`, and global chrome (nav, footer, coffee popup, coffee button, chat button, chat widget).

| Path | Page | Data |
| --- | --- | --- |
| `/` | Home | Featured essays, projects, upstream count, newsletter |
| `/articles` | Essay list | Filters by form, Start here flag, and search query |
| `/essays` | Redirect | Permanent redirect to `/articles` |
| `/articles/:slug` | Essay detail | Lazy markdown, reading telemetry, feedback, related |
| `/projects` | Project grid | `src/lib/projects.ts`, `src/lib/upstream.ts`, `src/lib/upstreamLedger.ts` |
| `/projects/:slug` | Project detail | Markdown and metrics in `src/lib/projects.ts` |
| `/about` | Bio / certs | Focus areas, certs, and live shelf/project/upstream counts |
| `/upstream` | `src/pages/Upstream.tsx` | Open-source merged PR ledger (`src/data/upstream-ledger.json`) |
| `*` | NotFound | `noIndex` SEO |

The `/projects` receipt strip shows the four curated receipts as one-line summaries while `/upstream` carries the full Issue and Fix account, joined by pull request URL.

SEO is `react-helmet-async` plus prerendered HTML (title, OG, JSON-LD). `GlobalBackgrounds` in `src/App.tsx` renders a static CSS atmospheric fallback on `/` and defers loading `AtmosphericBackground` and `NetworkBackground` (`three` and `vanta`) on `/` via `requestIdleCallback` only on fine-pointer desktop viewports without `prefers-reduced-motion`, while `src/lib/gpu` holds the standalone WebGPU/WebGL2 shader runtime tested in `tests/gpu.test.ts`.

## Backend

```
Request → api/<name>.ts (or Express)
       → lib/handlers/<name>.ts
       → Resend / Vertex / pure logic
       → JSON (or a redirect for subscribe confirm)
```

| Concern | Module |
| --- | --- |
| Rate limits | `lib/rate-limit.ts` (in-memory; per isolate on Vercel) |
| Input clamp / email | `lib/email.ts` |
| Public error messages | `lib/errors.ts` |
| Gemini client | `lib/vertex.ts` |
| Chat prompt | `lib/site-context.ts` |
| Subscribe tokens | `lib/subscribe-token.ts` |

## External systems

| System | Used for |
| --- | --- |
| Vercel | Static hosting and serverless APIs |
| GitHub `adi-IL/adityaai.dev` | Source |
| Google Cloud Vertex AI | Lab guide. Default model `gemini-3.7-flash` |
| Resend | Transactional email |
| Cloudinary | Brand and OG images (CDN URLs in HTML) |
| Fontshare / Google Fonts | Typography (CSP in `vercel.json`) |

## Security (what the code actually does)

- Secrets are server / Vercel env only.
- Public forms have honeypot fields (`website`, `_gotcha`, `company_url`) and per-IP rate limits.
- Subscribe is double opt-in. Confirm link before list write and welcome.
- `vercel.json` sets CSP, HSTS, `X-Frame-Options: DENY`, nosniff.
- Chat caps history at 11 turns and 2,000 characters per turn; local Express caps JSON bodies at 32kb. 5xx messages are generic.

See [API](./api.md) and [deploy](../operations/deployment.md).
