# How it works

## Page load (production)

1. Browser requests a URL (e.g. `/articles/memory-stacks-for-agents`).
2. Vercel rewrite serves **prerendered** `dist/articles/<slug>/index.html` when present (SEO meta already filled).
3. Browser loads hashed JS/CSS; React hydrates the SPA.
4. Client router takes over for further navigation (no full reload).
5. On Home only: after idle, lazy-loads Vanta/Three backgrounds.

Unknown paths fall through SPA `index.html` → React `NotFound` (with `noindex`).

---

## Essay shelf

### Build time

```
src/content/articles/*.md
        │
        ▼
scripts/generate-articles-meta.mjs
        │
        ▼
scripts/articles-meta.json   ← titles, excerpts, form, topics, featured, dates
        │
        ├── imported by client src/lib/articles.ts (listing)
        ├── used by lib/site-context.ts (chat prompt)
        └── used by scripts/prerender.mjs (HTML meta + sitemap + llms.txt)
```

### Runtime (article page)

1. List/meta from `articles-meta.json` (eager, small).
2. Body: `import.meta.glob` **lazy** loads only that markdown file.
3. Frontmatter stripped; title already shown from meta; markdown rendered with `react-markdown` + GFM.
4. Feedback form → `POST /api/feedback` → Resend to owner.

### Forms (taxonomy)

| Form | Meaning |
| --- | --- |
| **Framework** | Reusable decision model |
| **Architecture** | System maps / comparisons |
| **Principle** | Standing product/rules |

`featured: true` → “Start here” on Home.

---

## Lab guide chatbot

```
User opens floating "Lab guide"
        │
        ▼
SiteChatWidget  ──POST /api/chat──►  api/chat.ts
        │                              │
        │                              ▼
        │                         lib/handlers/chat.ts
        │                              │
        │                     rate limit · validate messages
        │                              │
        │                              ▼
        │                         lib/vertex.ts → Gemini
        │                         + lib/site-context.ts prompt
        │                              │
        ◄──────── { reply, sources? } ─┘
```

- **Site-first:** system prompt includes essay list + project cards + contact paths.
- **Search:** if `CHAT_ENABLE_SEARCH` and the last user message looks external/news-like, request may include Google Search grounding; citations returned as `sources`.
- **Session:** last messages kept in `sessionStorage` only (no server history).
- **Abuse:** honeypot field, per-IP rate limit, max message length / history depth.

Auth details: [deployment.md](./deployment.md) (Sentinel-style `GCP_*` env).

---

## Newsletter (double opt-in)

```
POST /api/subscribe { email }
        │
        ├─ honeypot / rate limits
        ├─ create HMAC confirm token (subscribe-token.ts)
        └─ Resend: "Confirm your subscription" email
                   link → GET /api/subscribe/confirm?token=...
                                │
                                ├─ verify token
                                ├─ Resend contacts.create (optional audience)
                                ├─ welcome email to subscriber
                                ├─ notify owner
                                └─ redirect to /?subscribed=1
```

No welcome email and no list write until confirm. This prevents open-relay abuse.

---

## Virtual coffee (leads)

```
POST /api/virtual-coffee { name, email, role?, message? }
        │
        ├─ validate · rate limit · honeypot
        ├─ Resend → owner (NOTIFY_EMAIL) with reply-to visitor
        └─ Resend → visitor confirmation
```

UI: auto-popup (cooldown in `localStorage`) + floating coffee button. Skipped mid-article detail so readers are not interrupted.

---

## Article feedback

```
POST /api/feedback { slug, title, reaction, comment?, email? }
        │
        └─ Resend → owner (reaction allowlist: insightful | useful | needs-depth)
```

---

## Projects

- Defined only in **`src/lib/projects.ts`** (not markdown files).
- Home, Projects list, LabStrip footer, and chat context all derive from this registry.
- Each project has `liveUrl` (subdomain) and `codeUrl` (GitHub).

---

## Brand cohesion (lab)

| File | Role |
| --- | --- |
| `src/components/BrandStamp.tsx` | Cross-site “adityaai · lab” mark |
| `src/components/LabStrip.tsx` | Three-project ribbon |
| `src/components/ProjectSignature.tsx` | Per-project visual signature |
| `src/lib/projects.ts` | Canonical project data |

Sibling repos should **mirror**, not fork, these files.

---

## Build pipeline detail

| Step | Output |
| --- | --- |
| `generate-articles-meta.mjs` | `scripts/articles-meta.json` |
| `vite build` | `dist/assets/*`, base `dist/index.html` |
| `prerender.mjs` | `dist/<route>/index.html`, `dist/sitemap.xml`, updates `public/llms.txt` + `dist/llms.txt` |

Prerender injects correct `<title>`, description, canonical, OG, and JSON-LD per essay/project for crawlers; body still hydrates via React.

---

## Rate limits (defaults)

| Namespace | Window | Max |
| --- | --- | --- |
| API (Express global) | 1 min | 30 |
| Chat | 1 hour | 20 / IP |
| Subscribe | 1 hour | 5 / IP (+ per-email daily cap) |
| Virtual coffee | 1 hour | 5 / IP |
| Feedback | 1 hour | 15 / IP |

In-memory store: effective per Node process (local) / per serverless isolate (Vercel). Not a global Redis limiter.
