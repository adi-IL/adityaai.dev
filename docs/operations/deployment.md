# Deploy

## Where it lives

| Layer | Location |
| --- | --- |
| Source | [github.com/adi-IL/adityaai.dev](https://github.com/adi-IL/adityaai.dev), branch `main` |
| CI | `.github/workflows/ci.yml` |
| Hosting | Vercel project `adityaai.dev` |
| Vercel alias | https://adityaaidev.vercel.app |
| Canonical host | https://www.adityaai.dev |
| Local | `http://localhost:3000` |
| Vertex project | `GCP_PROJECT_ID` / `GOOGLE_CLOUD_PROJECT`. Required for Vertex. No hardcoded default. |
| Vertex region | `global` unless `GCP_LOCATION` is set |

Related apps, not this repo:

| Product | URL |
| --- | --- |
| FRIDAY | https://friday.adityaai.dev |
| Sentinel | https://sentinel.adityaai.dev |
| MidSphere | https://midsphere.vercel.app |

## Production path

```
push to main
        │
        ▼
GitHub Actions ci.yml: npm ci → lint → test → build
        │
        ▼
Vercel
  1. npm install
  2. prebuild → scripts/generate-articles-meta.mjs
  3. vite build → dist/
  4. scripts/prerender.mjs → per-route HTML, sitemap.xml, llms.txt
  5. compile api/*.ts
        │
        ▼
CDN static (dist/**) + serverless /api/*
```

`vercel.json`: Vite, `outputDirectory` `dist`. Rewrites send `/api/*` to functions, essay/project paths to prerendered `index.html`, everything else to SPA `index.html`. Headers: CSP, HSTS, `X-Frame-Options: DENY`, long cache for hashed assets.

Pushes to `main` run CI, then Vercel Git integration deploys production. PRs get preview deploys. There is no `VERCEL_TOKEN` step in this repo.

## CI

On push to `main` and on every PR, matrix Node 20 / 22 / 24:

`npm ci` → `npm run lint` → `npm test` → `npm run build`, then `git diff --exit-code` on `scripts/articles-meta.json` and `public/llms.txt`.

`package.json` `engines.node` is `>=20.0.0`.

## Environment

Set these in Vercel project env (Production / Preview / Development). After a change, redeploy.

Email: `RESEND_API_KEY`, optional `NOTIFY_EMAIL`, `RESEND_AUDIENCE_ID`, `SUBSCRIBE_SECRET`, `APP_URL`.

Chat: `GCP_PROJECT_ID` (or aliases listed in [local run](../user/local.md)), `GCP_LOCATION`, `GCP_CREDENTIALS_JSON`, optional `GEMINI_API_KEY`, `GEMINI_MODEL`, `CHAT_ENABLE_SEARCH`.

Do not commit values. `.env*` is gitignored except `.env.example`.

## Operator commands

```bash
vercel link          # once, from repo root
git push origin main # CI then Vercel prod
vercel --prod        # manual, skips CI
vercel ls
vercel inspect <deployment-url>
```

## Domains

Prerender and SEO emit `https://www.adityaai.dev` as canonical. `public/robots.txt` points at `https://www.adityaai.dev/sitemap.xml`. Attach `www.adityaai.dev` and the apex in Vercel Domains if they are not already on the project.

## Not deployed from this repo

FRIDAY, Sentinel, and MidSphere app code. Local-only: `node_modules/`, `.env.local`, `.vercel/`.
