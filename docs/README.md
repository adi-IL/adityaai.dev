# adityaai.dev - documentation

Internal architecture and operations docs for the lab root site.

| Doc | What it covers |
| --- | --- |
| [Architecture](./architecture.md) | System shape, folders, stack, request paths |
| [How it works](./how-it-works.md) | Runtime flows: pages, essays, chat, email APIs |
| [Deployment](./deployment.md) | GitHub, Vercel, CI, domains, env vars, local vs prod |
| [Content system](./content-system.md) | Essay shelf, frontmatter, meta generation, prerender |
| [API reference](./api-reference.md) | All HTTP endpoints |

Root [README.md](../README.md) is the short contributor guide (setup, essays, scripts, CI).  
These files under `docs/` are the deeper map of the system.

**CI/CD:** `.github/workflows/ci.yml` gates `main` and PRs (typecheck + tests + build on Node 20/22/24); deploys happen via the Vercel Git integration on push to `main`. See [deployment.md](./deployment.md#ci--cd).

**Product north star:** decision tools for people who design production AI systems - not a high-volume blog.
