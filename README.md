# adityaai.dev

Root site for the adityaai lab. A small shelf of essays for people who design production AI systems, plus the control surface for [FRIDAY](https://friday.adityaai.dev), [Sentinel](https://sentinel.adityaai.dev), and [MidSphere](https://midsphere.vercel.app).

Live site: [www.adityaai.dev](https://www.adityaai.dev)

## What this repo is

The public site is a Vite + React SPA on Vercel, with serverless functions for newsletter, virtual coffee, article feedback, and the lab guide chat.

| Surface | Route | What it does |
| --- | --- | --- |
| Essays | `/articles` | Curated shelf. UI says Essays. URL stays `/articles`. |
| Projects | `/projects` | FRIDAY, Sentinel, MidSphere write-ups |
| About | `/about` | Bio and certifications |
| Newsletter | `POST /api/subscribe` | Double opt-in via Resend |
| Virtual coffee | `POST /api/virtual-coffee` | Lead form, two emails |
| Lab guide | `POST /api/chat` | Gemini chat, site-first |

This repository is private and proprietary. See [LICENSE](./LICENSE).

## Documentation

Full docs live in [docs/](./docs). There is no docs site.

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
