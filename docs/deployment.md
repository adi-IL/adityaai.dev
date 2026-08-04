# Deployment

## Where everything lives

| Layer | Location | Notes |
| --- | --- | --- |
| **Source** | [github.com/adi-IL/adityaai.dev](https://github.com/adi-IL/adityaai.dev) | Private repo, branch `main` |
| **Hosting** | Vercel team **aditya-ai-architects-projects** | Project name **`adityaai.dev`** |
| **Production URL (Vercel)** | https://adityaaidev.vercel.app | Default project alias |
| **Canonical brand domain** | https://www.adityaai.dev | Used in SEO, emails, site context |
| **Local** | `http://localhost:3000` | `npm run dev` (Express + Vite) |
| **GCP project (chat)** | Via env `GCP_PROJECT_ID` / `GOOGLE_CLOUD_PROJECT` | Same pattern as **sentinel-main** |
| **Vertex region** | `us-central1` (default via `GCP_LOCATION`) | |

Related lab apps (separate deploys, not this repo):

| Product | Typical URL |
| --- | --- |
| FRIDAY | https://friday.adityaai.dev |
| Sentinel | https://sentinel.adityaai.dev · Vercel project `sentinel-main` |
| OpalServe | https://opalserve.adityaai.dev |

---

## Production architecture on Vercel

```
git push origin main
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

Git is connected so pushes to `main` can trigger production builds (confirm in Vercel project settings).

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill secrets as needed
npm run dev                  # meta + Express on :3000
```

| Script | Purpose |
| --- | --- |
| `npm run dev` | Meta + `tsx server.ts` (Vite middleware) |
| `npm run build` | Meta + Vite + prerender |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | Unit tests |
| `npm run meta` | Regenerate `scripts/articles-meta.json` only |

**Local chat auth:** `gcloud auth application-default login` (ADC), or set the same GCP envs as production.

**Local APIs** are served by Express (`server.ts`), including `GET /api/health`.  
**Production** only has serverless files under `api/` — there is no `/api/health` unless you add `api/health.ts`.

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

### Required for lab guide chat (Vertex — Sentinel pattern)

| Variable | Purpose |
| --- | --- |
| `GCP_PROJECT_ID` | GCP project for Vertex |
| `GCP_LOCATION` | e.g. `us-central1` |
| `GCP_CREDENTIALS_JSON` | Full service-account JSON string (sensitive) |

**Auth order in `lib/vertex.ts` (same as Sentinel):**

1. `GEMINI_API_KEY` or `GOOGLE_API_KEY` → non-Vertex Google AI client  
2. Else write `GCP_CREDENTIALS_JSON` to `/tmp/gcp_adc.json` and set `GOOGLE_APPLICATION_CREDENTIALS`  
3. `GoogleGenAI({ vertexai: true, project, location })`

Aliases also accepted: `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, `GOOGLE_SERVICE_ACCOUNT_JSON`.

### Optional chat tuning

| Variable | Default | Purpose |
| --- | --- | --- |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Model id |
| `CHAT_ENABLE_SEARCH` | `true` | Google Search grounding when question looks external |

Set secrets in Vercel → Project → Settings → Environment Variables (Production / Preview / Development as needed).  
After changing env vars, **redeploy** production.

---

## Deploy commands (operators)

```bash
# From repo root (linked project)
vercel link          # once
git push origin main # preferred if Git integration is on
# or manual:
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

- FRIDAY / Sentinel / OpalServe app code (separate repos and Vercel projects).
- Local-only files: `node_modules/`, `.env.local`, `.vercel/` (gitignored).
