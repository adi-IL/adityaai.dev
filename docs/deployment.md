# Deployment

## Where everything lives

| Layer | Location | Notes |
| --- | --- | --- |
| **Source** | [github.com/adi-IL/adityaai.dev](https://github.com/adi-IL/adityaai.dev) | Private repo, branch `main` |
| **CI** | `.github/workflows/ci.yml` | Typecheck + tests + build on Node 20/22/24 |
| **Hosting** | Vercel | Project name **`adityaai.dev`** |
| **Production URL (Vercel)** | https://adityaaidev.vercel.app | Default project alias |
| **Canonical brand domain** | https://www.adityaai.dev | Used in SEO, emails, site context |
| **Local** | `http://localhost:3000` | `npm run dev` (Express + Vite) |
| **GCP project (chat)** | Via env `GCP_PROJECT_ID` / `GOOGLE_CLOUD_PROJECT` | Required for Vertex. No hardcoded default. |
| **Vertex region** | `global` (default via `GCP_LOCATION`) | |

Related lab apps (separate deploys, not this repo):

| Product | Typical URL |
| --- | --- |
| FRIDAY | https://friday.adityaai.dev |
| Sentinel | https://sentinel.adityaai.dev |
| MidSphere | https://midsphere.vercel.app |

---

## Production architecture on Vercel

```
push to main
        │
        ▼
GitHub Actions CI (ci.yml): npm ci → lint → test → build
        │
        ▼
Vercel build (Washington iad1, Node 24)
  1. npm install
  2. prebuild → scripts/generate-articles-meta.mjs
  3. vite build → dist/
  4. scripts/prerender.mjs → per-route HTML, sitemap.xml, llms.txt
  5. Compile api/*.ts serverless functions
        │
        ▼
CDN static + Serverless functions
  • Static: dist/**  (SPA + prerender shells)
  • Functions: /api/*
```

### `vercel.json` behavior

- **Rewrites:** `/api/*` → functions; essay/project paths → prerendered `index.html`; SPA fallback `/(.*)` → `/index.html`.
- **Headers:** security (CSP, HSTS, X-Frame-Options DENY, etc.) + long cache for hashed assets.
- **Framework:** Vite, `outputDirectory: dist`.

Git is connected, so pushes to `main` run CI then trigger production builds (confirm in Vercel project settings).

---

## CI / CD

| Stage | Where | What runs |
| --- | --- | --- |
| **CI** | GitHub Actions `.github/workflows/ci.yml` | `npm ci` → `npm run lint` → `npm test` → `npm run build`, on **push to `main`** and **every PR**. Matrix: Node 20 / 22 / 24. Fails fast on type errors, test regressions, or build breakage. Also verifies generated `scripts/articles-meta.json` and `public/llms.txt` match the committed state (no drift). |
| **CD** | Vercel Git integration | Deploys production on push to `main`; preview deploys on PRs. No `VERCEL_TOKEN` deploy step is needed. |

`package.json` pins `"engines": { "node": ">=20.0.0" }`; Vercel resolves to Node 24.

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill secrets as needed
npm run dev                  # meta + Express on :3000
```

`server.ts` loads env from `.env.local` then `.env` (in that order) via `dotenv.config({ path: ['.env.local', '.env'] })`. Keep personal overrides in `.env.local` and shared defaults in `.env`. Vercel env vars apply only on Vercel (never read locally).

Node.js 20+ (`"engines"`). CI runs Node 20/22/24; Vercel production uses Node 24.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Meta + `tsx server.ts` (Vite middleware) |
| `npm run build` | Meta + Vite + prerender |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | Unit tests |
| `npm run meta` | Regenerate `scripts/articles-meta.json` only |

**Local chat auth:** `gcloud auth application-default login` (ADC), or set the same GCP envs as production.

**Local APIs** are served by Express (`server.ts`), including `GET /api/health`.  
**Production** only has serverless files under `api/` - there is no `/api/health` unless you add `api/health.ts`.

---

## Environment variables

### Required for email APIs (Resend)

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Send mail |
| `NOTIFY_EMAIL` | Owner inbox for leads/feedback (optional default in code) |
| `RESEND_AUDIENCE_ID` | Optional list/segment for confirmed subscribers |
| `SUBSCRIBE_SECRET` | Optional HMAC for confirm tokens (falls back to Resend key) |
| `APP_URL` | Origin for confirm links (default `https://www.adityaai.dev`) |

### Required for lab guide chat (Vertex)

| Variable | Purpose |
| --- | --- |
| `GCP_PROJECT_ID` | GCP project for Vertex (or aliases: `GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT`, `VITE_GCP_PROJECT_ID`, `GCP_PROJECT`). Required when not using `GEMINI_API_KEY`. No default. |
| `GCP_LOCATION` | e.g. `global` (or aliases: `GOOGLE_CLOUD_LOCATION`, `VERTEX_LOCATION`; defaults to `global`) |
| `GCP_CREDENTIALS_JSON` | Full service-account JSON string or base64-encoded string (or aliases: `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_CREDENTIALS_JSON`) |

**Auth order in `lib/vertex.ts`:**

1. `GEMINI_API_KEY` or `GOOGLE_API_KEY` → non-Vertex Google AI client  
2. Else write `GCP_CREDENTIALS_JSON` to `/tmp/gcp_adc.json` and set `GOOGLE_APPLICATION_CREDENTIALS`  
3. `GoogleGenAI({ vertexai: true, project, location })`

Aliases also accepted: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_CREDENTIALS_JSON`, `GCLOUD_PROJECT`, `VITE_GCP_PROJECT_ID`, `GCP_PROJECT`, `VERTEX_LOCATION`.

### Optional chat tuning

| Variable | Default | Purpose |
| --- | --- | --- |
| `GEMINI_MODEL` | `gemini-3.7-flash` | Model id |
| `CHAT_ENABLE_SEARCH` | `true` | Google Search grounding when question looks external |

Set secrets in Vercel → Project → Settings → Environment Variables (Production / Preview / Development as needed).  
After changing env vars, **redeploy** production.

---

## Deploy commands (operators)

```bash
# From repo root (linked project)
vercel link          # once

# Preferred: open a PR → CI runs → merge to main → Vercel deploys prod
git push origin main

# or manual (bypasses CI):
vercel --prod
```

Inspect deployments:

```bash
vercel ls
vercel inspect <deployment-url>
```

---

## Domains & SEO

- Prerender + SEO components emit **`https://www.adityaai.dev`** as canonical.
- `public/robots.txt` points sitemap to `https://www.adityaai.dev/sitemap.xml`.
- Vercel default host is `adityaaidev.vercel.app`; attach custom domain `www.adityaai.dev` / apex in Vercel Domains if not already.

---

## What is *not* deployed from this repo

- FRIDAY / Sentinel / MidSphere app code (separate repos and Vercel projects).
- Local-only files: `node_modules/`, `.env.local`, `.vercel/` (gitignored).
