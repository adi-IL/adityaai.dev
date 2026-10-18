<div align="center">

<img
  src="https://res.cloudinary.com/dpdttqyow/image/upload/f_auto,q_auto,w_400/v1768512786/Screenshot_2026-01-198_v3bwry.png"
  alt="adityaai"
  width="300"
  height="222"
/>

# adityaai.dev

Root site for the adityaai lab. A small shelf of essays for people who design production AI systems, plus the control surface for [FRIDAY](https://friday.adityaai.dev), [Sentinel](https://sentinel.adityaai.dev), and [MidSphere](https://midsphere.vercel.app).

Live site: [www.adityaai.dev](https://www.adityaai.dev)

</div>



## What this repo is

The public site is a Vite + React SPA on Vercel, with serverless functions for newsletter, virtual coffee, article feedback, C2H support reports, and the lab guide chat.

| Surface | Route | What it does |
| --- | --- | --- |
| Home | `/` | Landing page, featured essays, and lab architecture stack |
| Essays | `/articles`, `/articles/:slug` | Curated shelf (`13` essays). UI says Essays. `/essays` redirects to `/articles`. |
| Projects | `/projects`, `/projects/:slug` | FRIDAY, Sentinel, MidSphere write-ups |
| About | `/about` | Bio, architectural focus, and certifications |
| Upstream | `/upstream` | Merged open-source PR ledger (`src/pages/Upstream.tsx`, `src/data/upstream-ledger.json`) |
| Newsletter | `POST /api/subscribe`, `GET /api/subscribe/confirm` | Double opt-in via Resend |
| Virtual coffee | `POST /api/virtual-coffee` | Lead form, two emails |
| Article feedback | `POST /api/feedback` | Reaction and optional comment email to owner |
| Lab guide | `POST /api/chat` | Gemini chat, site-first |
| C2H report | `POST /api/c2h-report` | Setup report email to owner (`lib/handlers/c2h-report.ts`) |

Source is public. Copyright stays with Aditya Gaurav. See [LICENSE](./LICENSE). This is not MIT or Apache.

## Documentation

Full docs live in [docs/](./docs). There is no docs site. Agents: [AGENTS.md](./AGENTS.md) (`CLAUDE.md` points at it).

- [Local run](./docs/user/local.md)
- [Essay shelf](./docs/user/essays.md)
- [Architecture](./docs/internals/overview.md)
- [How it works](./docs/internals/how-it-works.md)
- [API](./docs/internals/api.md)
- [Deploy](./docs/operations/deployment.md)

## Local

Node.js 20 or newer. Copy `.env.example` to `.env.local` and fill what you need.

```bash
npm install
cp .env.example .env.local
npm run dev
```

That regenerates essay meta, then serves Express + Vite on `http://localhost:3000`.

`server.ts` loads `.env.local` then `.env`. Keep machine-specific values in `.env.local`. Never commit real secrets. Chat and email need env vars. See [local run](./docs/user/local.md).

## License

Copyright (c) 2026 Aditya Gaurav. All rights reserved.

See [LICENSE](./LICENSE). Do not copy or redistribute without written permission.
