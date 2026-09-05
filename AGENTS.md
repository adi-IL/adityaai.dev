# adityaai.dev

adityaai.dev is the root site for the adityaai lab. A Vite + React SPA on Vercel, with serverless functions for newsletter, virtual coffee, article feedback, and a Gemini lab guide chat.

Live site: https://www.adityaai.dev

This repository is private and proprietary. See `LICENSE`. Do not treat it as an open-source project.

The rest of this file is for agents changing the code. Defaults, not hard law. The owner's instructions win.

## What not to compromise

### 1. Accurate over complete

Do not invent essays, GitHub repos, env defaults, or product claims. If a source URL 404s, do not list it as public. The essay shelf and `src/lib/projects.ts` are the inventory.

### 2. Secrets stay out of git

`.env*` is gitignored except `.env.example`. Never commit Resend keys, service-account JSON, or a hardcoded GCP project id. Vertex has no project fallback. `GCP_PROJECT_ID` (or an alias) or `GEMINI_API_KEY` must come from env.

### 3. Small shelf

Twelve essays is the current shelf. Prefer updating a thesis in place over adding a near-duplicate. `featured: true` is the Home "Start here" set. Keep that list short.

### 4. Site-first lab guide

`lib/site-context.ts` is what the chat is allowed to claim. Do not teach the model essays or projects that are not in that context.

## Glossary

- **you** means the agent reading this file and changing this repo.
- **owner** means Aditya Gaurav, who owns the site and the secrets.
- **visitor** means someone using www.adityaai.dev.
- **lab guide** means the Gemini chat behind `POST /api/chat`.
- **essay** means a markdown file in `src/content/articles/`.
- **project** means an entry in `src/lib/projects.ts` (FRIDAY, Sentinel, MidSphere).

## Ways to hurt this repo

1. **Committing secrets.** Do not add `.env`, `.env.local`, `GCP_CREDENTIALS_JSON`, or `doctor.json`.
2. **Hand-editing generated files as source.** Edit markdown or `projects.ts`, then regenerate. `scripts/articles-meta.json` and `public/llms.txt` are outputs. CI fails if they drift.
3. **Killing by pattern.** Do not `pkill -f` for vite, tsx, or node. Kill only a PID you started.
4. **Broken source links.** The project registry stores `codeUrl` values. Do not document FRIDAY or Sentinel GitHub as public unless you have just confirmed they resolve.

## Hit every surface

A change that works on one page and lies on another is unfinished.

- **Registry.** Home, Projects, LabStrip, chat context, and prerender all read `src/lib/projects.ts`.
- **Brand files.** `BrandStamp.tsx`, `LabStrip.tsx`, `ProjectSignature.tsx` are the lab marks. Sibling sites copy these. Do not fork them here.
- **Essays.** Markdown, `articles-meta.json`, prerender HTML, sitemap, and `llms.txt` must agree.
- **APIs.** Vercel `api/*.ts` and local `server.ts` share `lib/handlers/*`. Change the handler, not one wrapper.
- **Docs.** If you change env names, routes, or rate limits, update `docs/` so it stays true. See [Documentation](#documentation).

## Dev

```bash
npm install
cp .env.example .env.local
npm run dev
```

Serves `http://localhost:3000`. Loads `.env.local` then `.env`. Chat and email need env. Local Vertex can use `gcloud auth application-default login`.

Details: `docs/user/local.md`.

## Verifying

Smallest proof that the change works.

- `npm test` for the tests you touched (`tsx --test tests/*.test.ts`).
- `npm run lint` (`tsc --noEmit`) for type-bearing edits.
- Essay or prerender changes: `npm run build` so `scripts/articles-meta.json` and `public/llms.txt` match what CI will diff.
- Do not run the GitHub Actions Node 20/22/24 matrix locally unless asked. CI owns that.

Do not invent tests that only restate the implementation.

## Pull requests

Do not open a GitHub PR unless the owner asks. Conventional commit titles. Body: what changed and why. No `Assisted-by` trailers.

## Documentation

Most code changes do not need a docs change. Agents can read the code.

- `docs/user/` is how to run the site and how to add an essay.
- `docs/internals/` is architecture, request flows, and the HTTP API. Write down constraints the source does not make obvious. If reading the handler answers it, leave it out.
- `docs/operations/` is deploy, CI, and Vercel env.
- Root `README.md` stays short and points here.
- When a documented fact changes, rewrite the sentence. Do not append a second account.
- Old paths under `docs/*.md` are one-line pointers to the new files. Keep them working.

## Where code lives

- `src/` React SPA. Routes in `src/App.tsx`.
- `src/content/articles/` essay markdown.
- `src/lib/projects.ts` project registry.
- `lib/` server logic shared by Express and Vercel.
- `api/` Vercel serverless entrypoints.
- `server.ts` local Express + Vite.
- `scripts/generate-articles-meta.mjs` essay index.
- `scripts/prerender.mjs` per-route HTML, sitemap, `llms.txt`.
- `tests/` Node test runner via `tsx --test`.

## Taste

Write less. Match the files next to your change. Do not add a fallback that hides a missing env. Do not expand the essay shelf without being asked.

If a rule here fights the task, say so and wait for a human.
