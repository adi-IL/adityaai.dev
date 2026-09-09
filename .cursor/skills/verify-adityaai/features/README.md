# adityaai.dev verification map

Maintained source for visitor-facing proofs of https://www.adityaai.dev (and local `npm run dev`).

## Baseline preconditions

- Set `ADITYAAI_BASE_URL` to production or `http://127.0.0.1:3000`.
- Set `ADITYAAI_VERIFY_DIR` to a disposable directory under `/tmp`.
- Run `node .cursor/skills/verify-adityaai/scripts/doctor.mjs` and require exit `0`.
- Prefer a desktop-width browser so the top pill nav is visible.
- Never drive a local instance you did not start in this run.

## Driving conventions

- Start from doctor green unless a feature says otherwise.
- Prefer link names (`Home`, `Essays`, `Projects`, `About`) and route paths over CSS or coordinates.
- Treat commands in feature files as literal.
- HTTP checks use `scripts/http-probe.mjs` and `scripts/doctor.mjs`.
- Browser checks use a browser/desktop subagent; record screenshots under `$ADITYAAI_VERIFY_DIR/artifacts/`.
- Do not send newsletter, coffee, feedback, or chat in default runs.

## Proof and skip reporting

- Capture action plus resulting state.
- UI proof includes a screenshot with site identity visible.
- HTTP proof includes status, Location when redirecting, and a body excerpt.
- Record the feature ID with every artifact.
- If an entry point is unreachable, report the attempt and the unmet precondition.

## Feature entry contract

Each feature file: H1, one paragraph, then exactly four H2s in order: `Sub-features`, `How to get to it (user POV)`, `Driving it with verify-adityaai`, `Gotchas`.

## Features

- [Navigation and core pages](./nav-core-pages.md) home, essays list, projects list, about.
- [Projects Upstream strip](./projects-upstream.md) Critical impacts in open source on `/projects`.
- [Essay redirect and hard 404](./essays-redirect-404.md) `/essays` to `/articles`, missing slug hard 404.
- [Brand files](./brand-files.md) `llms.txt`, `sitemap.xml`, `robots.txt`.
- [Project detail card](./project-detail.md) open a registry project from `/projects`.
