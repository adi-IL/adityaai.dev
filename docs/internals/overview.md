# Architecture

adityaai.dev is the root site of the adityaai lab: twelve essays, a three-project registry, About, newsletter, virtual coffee, and the lab guide chat.

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
        ├── Resend (newsletter, coffee, feedback)
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
  chat.ts
  feedback.ts
  subscribe.ts
  subscribe/confirm.ts
  virtual-coffee.ts
lib/                      Shared server logic
  handlers/               chat, subscribe, feedback, virtual-coffee
  vertex.ts               Gemini / Vertex client
  site-context.ts         Chat system prompt
  email.ts, errors.ts, http.ts, rate-limit.ts
  subscribe-token.ts      Double opt-in HMAC
src/                      React SPA
  pages/
  components/
  content/articles/       Essay markdown
  lib/                    articles.ts, projects.ts
scripts/
  generate-articles-meta.mjs
  articles-meta.json
  article-dates.json
  prerender.mjs
public/                   robots, 404, llms seed
tests/
.github/workflows/ci.yml
server.ts                 Local Express + Vite
vercel.json               Rewrites, security headers, cache
docs/
```

## Frontend

`main.tsx` mounts `App.tsx`: router, LazyMotion, global chrome (nav, footer, coffee popup, coffee button, chat).

| Path | Page | Data |
| --- | --- | --- |
| `/` | Home | Featured essays, projects, newsletter |
| `/articles` | Essay list | Filters by form |
| `/articles/:slug` | Essay detail | Lazy markdown, feedback, related |
| `/projects` | Project grid | `src/lib/projects.ts` |
| `/projects/:slug` | Project detail | Markdown in the registry |
| `/about` | Bio / certs | Static plus external cert links |
| `*` | NotFound | `noIndex` SEO |

SEO is `react-helmet-async` plus prerendered HTML (title, OG, JSON-LD). Vanta/Three backgrounds load on Home only, after idle.

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
- Public forms have honeypot fields and per-IP rate limits.
- Subscribe is double opt-in. Confirm link before list write and welcome.
- `vercel.json` sets CSP, HSTS, `X-Frame-Options: DENY`, nosniff.
- Chat caps history and body size. 5xx messages are generic.

See [API](./api.md) and [deploy](../operations/deployment.md).
