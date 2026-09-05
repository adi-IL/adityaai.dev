# Local run

Node.js 20 or newer (`package.json` `engines`). CI runs 20, 22, and 24.

```bash
npm install
cp .env.example .env.local
npm run dev
```

`npm run dev` runs `scripts/generate-articles-meta.mjs`, then `tsx server.ts`. The server listens on `http://localhost:3000` (`PORT` overrides). It binds `0.0.0.0`.

`server.ts` loads env from `.env.local` then `.env` via `dotenv.config({ path: ['.env.local', '.env'] })`. Put personal overrides in `.env.local`. Vercel env is not read on your machine.

## Scripts

| Script | What it runs |
| --- | --- |
| `npm run dev` | Meta, then Express + Vite middleware |
| `npm run start` | `tsx server.ts` with no extra env. Vite middleware unless `NODE_ENV=production`, in which case it serves `dist/`. |
| `npm run build` | `prebuild` meta, Vite build, `scripts/prerender.mjs` |
| `npm run preview` | Vite preview of the production build |
| `npm run clean` | `rm -rf dist` |
| `npm run lint` | `tsc --noEmit` |
| `npm test` | `tsx --test tests/*.test.ts` |
| `npm run meta` | Write `scripts/articles-meta.json` only |

## Environment

Names only. Values live in the host, never in git.

### Email (Resend)

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | For email APIs | Newsletter, feedback, virtual coffee |
| `RESEND_AUDIENCE_ID` | No | Resend audience for confirmed subscribers |
| `SUBSCRIBE_SECRET` | No | HMAC for confirm links. Defaults to `RESEND_API_KEY`. |
| `APP_URL` | No | Origin in confirm emails. Default `https://www.adityaai.dev`. |
| `NOTIFY_EMAIL` | No | Owner inbox. Default `aiexpert@adityaai.dev`. |

### Lab guide (Vertex / Gemini)

Auth order in `lib/vertex.ts`:

1. `GEMINI_API_KEY` or `GOOGLE_API_KEY` uses Google AI Studio and skips Vertex.
2. Else Vertex. `GCP_CREDENTIALS_JSON` (or `GOOGLE_SERVICE_ACCOUNT_JSON` / `GOOGLE_CREDENTIALS_JSON`) is written to `/tmp/gcp_adc.json` when `GOOGLE_APPLICATION_CREDENTIALS` is unset. Locally, `gcloud auth application-default login` is enough.

| Variable | Required | Purpose |
| --- | --- | --- |
| `GCP_PROJECT_ID` | For Vertex | No hardcoded default. Aliases: `GOOGLE_CLOUD_PROJECT`, `GCLOUD_PROJECT`, `VITE_GCP_PROJECT_ID`, `GCP_PROJECT`. |
| `GCP_LOCATION` | No | Default `global`. Aliases: `GOOGLE_CLOUD_LOCATION`, `VERTEX_LOCATION`. |
| `GCP_CREDENTIALS_JSON` | Prod Vertex | Service-account JSON string or base64. Do not commit. |
| `GEMINI_MODEL` | No | Default `gemini-3.7-flash` |
| `CHAT_ENABLE_SEARCH` | No | Default `true` |
| `PORT` | No | Default `3000` |

## Local vs production APIs

Local Express in `server.ts` serves the same handlers as Vercel `api/*.ts`, plus `GET /api/health` (`{ "status": "ok" }`). There is no `api/health.ts`, so production has no `/api/health`.

Local Express mounts `GET /api/subscribe/confirm` only. The handler itself accepts GET and POST.

JSON body limit on the local server is 32kb.
