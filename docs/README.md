# Docs

## Running the site

- [Local run](./user/local.md)
- [Essay shelf](./user/essays.md)

---

## Internals

- [Architecture](./internals/overview.md)
- [How it works](./internals/how-it-works.md)
- [API](./internals/api.md)

---

## Operations

- [Deploy](./operations/deployment.md)

Root [README](../README.md) is the short entry. These files are the map of the system.

CI is `.github/workflows/ci.yml` (typecheck, tests, build on Node 20 / 22 / 24). Deploys are the Vercel Git integration on push to `main`.
