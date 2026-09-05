# How it works

## Page load (production)

1. Browser requests a URL, for example `/articles/memory-stacks-for-agents`.
2. Vercel rewrite serves prerendered `dist/articles/<slug>/index.html` when that file exists.
3. Hashed JS/CSS load. React hydrates the SPA.
4. Client router handles further navigation.
5. On Home only, after idle, Vanta/Three backgrounds lazy-load.

Unknown paths fall through SPA `index.html` to React `NotFound` with `noindex`.

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
                 { reply, model, functionCalls?, sources? }
```

- Default model `gemini-3.7-flash` (`GEMINI_MODEL`). `temperature: 0.4`, `maxOutputTokens: 1024`.
- System prompt includes the essay list, project cards, and contact paths.
- Starter chips change with the active route.
- The model may emit `navigateTo` with a `path`. If there is no text, the handler fills `Navigating to {path}...`.
- If `CHAT_ENABLE_SEARCH` is true (default) and the last user message looks external, the request may include Google Search grounding. Citations come back as `sources`.
- History is `sessionStorage` only, last 12 messages. No server-side chat log.
- Honeypot field. 20 requests / hour / IP. Max 12 messages, 2,000 characters each.

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

Rate-limited subscribe calls still return the generic 200 body so the endpoint does not leak whether an address is new.

## Virtual coffee

```
POST /api/virtual-coffee { name, email, role?, message? }
        │
        ├─ validate, rate limit, honeypot
        ├─ Resend → NOTIFY_EMAIL, reply-to visitor
        └─ Resend → visitor confirmation
```

UI: auto-popup 25 seconds after mount, 7-day cooldown in `localStorage` key `adityaai:virtual-coffee`. Skipped on `/articles/<slug>` so a reader is not interrupted. Floating coffee button is separate.

## Article feedback

```
POST /api/feedback { slug, title, reaction, comment?, email? }
        │
        └─ Resend → owner
```

`reaction` allowlist: `insightful`, `useful`, `needs-depth`.

## Projects

Defined only in `src/lib/projects.ts`. Home, Projects list, LabStrip, and chat context all read that registry.

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
| `generate-articles-meta.mjs` | `scripts/articles-meta.json` |
| `vite build` | `dist/assets/*`, `dist/index.html` |
| `prerender.mjs` | `dist/<route>/index.html`, `dist/sitemap.xml`, `public/llms.txt` and `dist/llms.txt` |

Prerender injects title, description, canonical, OG, and JSON-LD per essay and project. The body still hydrates in React.

## Rate limits

From `lib/rate-limit.ts` and inline checks in `lib/handlers/subscribe.ts`. In-memory. Per Node process locally, per serverless isolate on Vercel. Not Redis.

Local Express also wraps `/api/` with `express-rate-limit` at 30 / minute. That middleware is not in the Vercel functions. `RATE_LIMITS.api` is defined as 30 / minute but no handler reads it.

| Namespace | Window | Max |
| --- | --- | --- |
| Chat | 1 hour | 20 / IP |
| Subscribe | 1 hour | 5 / IP |
| Subscribe per email | 24 hours | 2 / address |
| Subscribe confirm | 1 hour | 10 / (IP + email) |
| Subscribe welcome + notify | 24 hours | 1 / email |
| Virtual coffee | 1 hour | 5 / IP |
| Feedback | 1 hour | 15 / IP |
