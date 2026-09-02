# Architecture

## What this product is

**adityaai.dev** is the root site of the adityaai lab:

- Curated **essay shelf** (12 decision-tool essays: Framework / Architecture / Principle)
- **Projects** registry (FRIDAY, Sentinel, MidSphere) with awards and metrics
- **About** + newsletter + virtual coffee leads
- **Lab guide chatbot** (Vertex AI / Gemini, site-first answers)

Sibling products live on their own subdomains and repos; this site is the control surface and brand home.

---

## High-level diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Browser (SPA)                            │
│  React 19 + React Router + Tailwind + Motion                     │
│  Pages · SEO · Floating chat · Virtual coffee                    │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  Production (Vercel)                                             │
│  ┌──────────────────────┐    ┌───────────────────────────────┐  │
│  │ Static CDN           │    │ Serverless Node functions     │  │
│  │ dist/ HTML, JS, CSS  │    │ api/*.ts → lib/handlers/*     │  │
│  │ prerendered routes   │    │ /api/chat, subscribe, …       │  │
│  │ sitemap, robots,llms │    └───────────────┬───────────────┘  │
│  └──────────────────────┘                    │                  │
└──────────────────────────────────────────────┼──────────────────┘
                                               │
               ┌───────────────────────────────┼──────────────────┐
               ▼                               ▼                  ▼
        ┌─────────────┐               ┌──────────────┐    ┌────────────┐
        │ Resend      │               │ Vertex AI    │    │ (optional) │
        │ email API   │               │ Gemini       │    │ Google     │
        │ newsletter, │               │ lab guide    │    │ Search     │
        │ coffee, FB  │               │ chat         │    │ grounding  │
        └─────────────┘               └──────────────┘    └────────────┘
```

---

## Runtime modes

| Mode | Entry | Frontend | APIs |
| --- | --- | --- | --- |
| **Local dev** | `npm run dev` → `tsx server.ts` | Vite middleware (HMR) | Same handlers via Express |
| **Production** | Vercel | Static files from `dist/` | Vercel Serverless `api/*.ts` |

Shared business logic lives in **`lib/`** so Express and Vercel stay thin wrappers.

---

## Repository layout

```
adityaai.dev/
├── api/                    # Vercel serverless entrypoints (thin)
│   ├── chat.ts
│   ├── feedback.ts
│   ├── subscribe.ts
│   ├── subscribe/confirm.ts
│   └── virtual-coffee.ts
├── lib/                    # Shared server logic
│   ├── handlers/           # chat, subscribe, feedback, virtual-coffee
│   ├── vertex.ts           # Gemini / Vertex client (Sentinel auth pattern)
│   ├── site-context.ts     # Chat system prompt + essay/project context
│   ├── email.ts, errors.ts, http.ts, rate-limit.ts
│   └── subscribe-token.ts  # Double opt-in HMAC tokens
├── src/                    # React SPA
│   ├── pages/              # Home, Essays, Projects, About, NotFound
│   ├── components/         # UI chrome, chat, coffee, SEO, backgrounds
│   ├── content/articles/   # Markdown essays (source of truth)
│   ├── lib/                # Client data: articles.ts, projects.ts
│   ├── App.tsx, main.tsx, index.css
├── scripts/
│   ├── generate-articles-meta.mjs   # Build-time essay index JSON
│   ├── articles-meta.json           # Generated listing metadata
│   ├── article-dates.json           # Optional date overrides
│   └── prerender.mjs                # Static HTML per route + sitemap + llms.txt
├── public/                 # Static assets copied to dist (robots, 404, llms seed)
├── tests/                  # Unit tests (rate limit, email helpers, tokens, errors, handlers)
├── .github/workflows/      # CI gate (typecheck + tests + build)
├── server.ts               # Local Express + Vite (loads .env.local then .env)
├── vercel.json             # Rewrites, security headers, cache
├── docs/                   # This documentation
└── README.md
```

---

## Frontend architecture

| Layer | Tech | Responsibility |
| --- | --- | --- |
| Shell | `main.tsx` → `App.tsx` | Router, LazyMotion, global chrome |
| Routes | React Router 7 | `/`, `/articles`, `/articles/:slug`, `/projects`, `/projects/:slug`, `/about`, `*` |
| SEO | `react-helmet-async` + prerender HTML | Title, OG, JSON-LD, noindex on 404 |
| Essays | Markdown → lazy raw import | Meta from JSON; body loaded per slug |
| Projects | `src/lib/projects.ts` | Single registry for Home, Projects, LabStrip |
| Decor | Vanta/Three (Home only, idle-loaded) | Atmospheric + network backgrounds |
| Widgets | Floating chat + coffee | Lab guide (`/api/chat`), lead capture |

### Client routes

| Path | Page | Data |
| --- | --- | --- |
| `/` | Home | Featured essays, projects, newsletter |
| `/articles` | Essay list | Filters by form (Framework / Architecture / Principle) |
| `/articles/:slug` | Essay detail | Lazy markdown + feedback + related |
| `/projects` | Project grid | From `projects.ts` |
| `/projects/:slug` | Project detail | Markdown content inline in registry |
| `/about` | Bio / certs | Static + external cert links |
| `*` | NotFound | `noIndex` SEO |

---

## Backend architecture

```
Request  →  api/<name>.ts  (or Express route)
         →  lib/handlers/<name>.ts
         →  Resend / Vertex / pure logic
         →  JSON (or redirect for subscribe confirm)
```

| Concern | Module |
| --- | --- |
| Rate limits | `lib/rate-limit.ts` (in-memory; per-isolate on Vercel) |
| Input clamp / email | `lib/email.ts` |
| Public error messages | `lib/errors.ts` |
| Gemini client | `lib/vertex.ts` (API key **or** SA JSON → `/tmp` → ADC) |
| Chat prompt | `lib/site-context.ts` |
| Subscribe double opt-in | `lib/subscribe-token.ts` + Resend |

---

## External systems

| System | Used for |
| --- | --- |
| **Vercel** | Hosting static + serverless APIs |
| **GitHub** `adi-IL/adityaai.dev` | Source of truth (private) |
| **Google Cloud Vertex AI** | Lab guide chat model (`gemini-3.7-flash` default) |
| **Resend** | Transactional email (subscribe, coffee, feedback) |
| **Cloudinary** | Brand/OG images (CDN URLs in HTML) |
| **Fontshare / Google Fonts** | Typography |

---

## Security posture (summary)

- Secrets only on server / Vercel env (never in client bundle).
- API rate limits + honeypot fields on public forms.
- Subscribe is **double opt-in** (confirm link before list + welcome).
- CSP, HSTS, frame deny, nosniff via `vercel.json`.
- Chat: history capped, body size limited, generic 5xx messages.

See [deployment.md](./deployment.md) for env var names and [api-reference.md](./api-reference.md) for endpoints.
