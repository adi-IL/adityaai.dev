# How it works

## Page load (production)

1. Browser requests a URL, for example `/articles/memory-stacks-for-agents`.
2. Vercel rewrite serves prerendered `dist/articles/<slug>/index.html` when that file exists.
3. Hashed JS/CSS load. React hydrates the SPA.
4. Client router handles further navigation.
5. `GlobalBackgrounds` in `src/App.tsx` renders a static CSS atmospheric backdrop immediately and defers loading `AtmosphericBackground` and `NetworkBackground` (`three` and `vanta`) on `/` via `requestIdleCallback` only on fine-pointer desktop viewports without `prefers-reduced-motion`.

Missing `/articles/:slug`, `/projects/:slug`, or unknown paths return HTTP 404 (`dist/404.html`, no SPA catch-all rewrite on Vercel). During client-side navigation or local `NODE_ENV=production` Express, unmatched routes render React `NotFound` with `noindex`.

## Essay shelf

Build time:

```
src/content/articles/*.md
        │
        ▼
scripts/generate-articles-meta.mjs
        │
        ▼
scripts/articles-meta.json
        ├── src/lib/articles.ts (listing)
        ├── lib/site-context.ts (chat prompt)
        ├── lib/handlers/feedback.ts (slug allowlist)
        └── scripts/prerender.mjs (HTML meta, sitemap, llms.txt)
```

On an article page, list/meta comes from `articles-meta.json`. The body is a lazy raw import of that one markdown file. Frontmatter is stripped. Title comes from meta. Body renders with `react-markdown` and GFM. Feedback posts to `POST /api/feedback`.

`featured: true` is Home "Start here". Details of the shelf: [essays](../user/essays.md).

## Lab guide

```
SiteChatWidget  --POST /api/chat-->  api/chat.ts
                                       │
                                       ▼
                                 lib/handlers/chat.ts
                                       │
                                 rate limit, validate
                                       │
                                       ▼
                                 lib/vertex.ts → Gemini
                                 lib/site-context.ts prompt
                                       │
          { reply, model, functionCalls, usedSearch, sources? }
```

- Default model `gemini-3.7-flash` (`GEMINI_MODEL`). `temperature: 0.4`, `maxOutputTokens: 1024`.
- System prompt includes the essay list, project cards, upstream ledger summary, and contact paths.
- Starter chips change with the active route.
- The model may emit `navigateTo` with a `path`. If there is no text, the handler fills `Navigating to {path}...`.
- If `CHAT_ENABLE_SEARCH` is true (default) and the last user message looks external, the request may include Google Search grounding. Citations come back as `sources`.
- Client history is `sessionStorage` only (last 12 messages, 2-second client send cooldown). The server accepts odd-length alternating `user`/`assistant` arrays ending in `user` and keeps the last 11 messages (`MAX_MESSAGES = 11`). No server-side chat log.
- Honeypot fields (`website`, `_gotcha`, `company_url`). 3 requests / 10 seconds / IP burst and 20 requests / hour / IP. Max 11 messages per request, 2,000 characters each.

## Newsletter

```
POST /api/subscribe { email }
        │
        ├─ honeypot, rate limits
        ├─ HMAC confirm token (48h TTL)
        └─ Resend: confirm email
                   GET /api/subscribe/confirm?token=...
                                │
                                ├─ verify token
                                ├─ Resend contacts.create (optional audience)
                                ├─ welcome to subscriber (at most once / 24h / email)
                                ├─ notify owner
                                └─ redirect /?subscribed=1
```

No welcome and no list write until confirm.

Per-email subscribe rate limits (`subscribe:email`, 2 per 24 hours) return the generic `200` body so the endpoint does not leak whether an address is new, while per-IP limits (`subscribe:ip`, 5 per hour) return `429`.

## Virtual coffee

```
POST /api/virtual-coffee { name, email, role?, message? }
        │
        ├─ validate, rate limit, honeypot
        ├─ Resend → NOTIFY_EMAIL, reply-to visitor
        └─ Resend → visitor confirmation
```

UI: auto-popup 25 seconds after mount, 7-day cooldown in `localStorage` key `adityaai:virtual-coffee`. Skipped on `/` and `/articles/<slug>` so visitors are not interrupted. Floating coffee button is separate.

## Article feedback

```
POST /api/feedback { slug, title, reaction, comment?, email? }
        │
        └─ Resend → owner
```

`reaction` allowlist: `insightful`, `useful`, `needs-depth`. `slug` allowlist: all slugs in `scripts/articles-meta.json` plus `friday`, `sentinel`, `midsphere`, and `general`.

## Projects

Defined only in `src/lib/projects.ts`. Home, Projects list, ProjectDetail, About, LabStrip, chat context, and `scripts/prerender.mjs` all read that registry.

Live hosts used today:

| Project | Live |
| --- | --- |
| FRIDAY | https://friday.adityaai.dev |
| Sentinel | https://sentinel.adityaai.dev |
| MidSphere | https://midsphere.vercel.app |

MidSphere source on GitHub is [adi-IL/MidSphere](https://github.com/adi-IL/MidSphere). The registry also stores `codeUrl` values for FRIDAY and Sentinel. Those GitHub URLs are what the site links. They are not claimed as public here.

## Build pipeline

| Step | Output |
| --- | --- |
| `sync-ledger.mjs` | `src/data/upstream-ledger.json` (manual via `npm run sync:ledger`) |
| `generate-articles-meta.mjs` | `scripts/articles-meta.json` (`prebuild`) |
| `vite build` | `dist/assets/*`, `dist/index.html` |
| `prerender.mjs` | 21 `dist/<route>/index.html` pages, `dist/sitemap.xml` (21 URLs), `public/llms.txt` and `dist/llms.txt` |

`scripts/prerender.mjs` injects title, description, canonical, OG, and JSON-LD per route, and injects semantic HTML inside `<noscript><div id="prerendered-content">`. `src/main.tsx` removes `#prerendered-content` before mounting into `#root`.

## Rate limits

From `lib/rate-limit.ts` and inline checks in `lib/handlers/subscribe.ts`. In-memory. Per Node process locally, per serverless isolate on Vercel. Not Redis.

Local Express also wraps `/api/` with `express-rate-limit` at 30 / minute. That middleware is not in the Vercel functions.

| Namespace (`checkRateLimit`) | Window | Max |
| --- | --- | --- |
| `chat:hourly` | 1 hour | 20 / IP |
| `chat:burst` | 10 seconds | 3 / IP |
| `subscribe:ip` | 1 hour | 5 / IP |
| `subscribe:email` | 24 hours | 2 / address |
| `subscribe:confirm` | 1 hour | 10 / (IP + email) |
| `subscribe:welcome` | 24 hours | 1 / email |
| `virtual-coffee` | 1 hour | 5 / IP |
| `feedback` | 1 hour | 15 / IP |
| `c2h-report` | 1 hour | 15 / IP |
