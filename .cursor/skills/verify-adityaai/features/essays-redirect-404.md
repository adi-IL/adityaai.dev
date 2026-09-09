# Essay redirect and hard 404

Legacy `/essays` permanently redirects to `/articles`. Missing essay and project URLs return a real HTTP 404 with the branded error page, not a soft-200 SPA shell.

## Sub-features

- `essays-redirect` maps `/essays` to `/articles` with a permanent redirect.
- `dead-essay-404` returns 404 for an unknown article slug.
- `dead-project-404` returns 404 for an unknown project slug.
- `live-essay-200` keeps a real shelf essay at 200.

## How to get to it (user POV)

- Visit `/essays` in the browser or via curl.
- Visit a garbage article or project path.
- Visit a real article from the shelf.

## Driving it with verify-adityaai

Preconditions:

- Doctor is green.
- Prefer production for redirect status codes (Vercel).

- **Redirect.** Run `node .cursor/skills/verify-adityaai/scripts/http-probe.mjs /essays --expect-redirect /articles`.
- **Dead essay.** Run `node .cursor/skills/verify-adityaai/scripts/http-probe.mjs /articles/does-not-exist-verify-adityaai --expect-status 404`.
- **Dead project.** Run `node .cursor/skills/verify-adityaai/scripts/http-probe.mjs /projects/does-not-exist-verify-adityaai --expect-status 404`.
- **Live essay.** Run `node .cursor/skills/verify-adityaai/scripts/http-probe.mjs /articles/the-chat-template-trap --expect-status 200`.
- **Browser dead path.** Open the dead essay URL. Branded 404 content appears. Screenshot `$ADITYAAI_VERIFY_DIR/artifacts/essays-redirect-404/dead-essay.png`.
- **Proof.** Save probe transcript to `$ADITYAAI_VERIFY_DIR/artifacts/essays-redirect-404/probe.log`.

## Gotchas

- Soft-200 (SPA catch-all serving index for missing paths) is a regression. Status must be 404.
- Zombie GSC URLs may linger in Search Console after the hard 404 ships. That is crawl lag, not a soft-200.
