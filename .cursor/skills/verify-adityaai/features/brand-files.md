# Brand files

Public machine-readable files stay consistent with the shelf: `llms.txt`, `sitemap.xml`, and `robots.txt`.

## Sub-features

- `llms-present` serves `llms.txt` with person, pages, lab products, and Critical impacts section.
- `sitemap-present` serves `sitemap.xml` listing www URLs.
- `robots-present` serves `robots.txt`.

## How to get to it (user POV)

- Open `/llms.txt`, `/sitemap.xml`, or `/robots.txt` directly.

## Driving it with verify-adityaai

Preconditions:

- Doctor is green.

- **llms.** `node .cursor/skills/verify-adityaai/scripts/http-probe.mjs /llms.txt --expect-status 200 --grep adityaai.dev --grep "Critical impacts in open source"`
- **sitemap.** `node .cursor/skills/verify-adityaai/scripts/http-probe.mjs /sitemap.xml --expect-status 200 --grep www.adityaai.dev`
- **robots.** `node .cursor/skills/verify-adityaai/scripts/http-probe.mjs /robots.txt --expect-status 200`
- **Proof.** Save bodies under `$ADITYAAI_VERIFY_DIR/artifacts/brand-files/`.

## Gotchas

- `public/llms.txt` and `scripts/articles-meta.json` are generated. After essay edits, `npm run build` must keep them honest or CI fails.
- Do not invent essays in `llms.txt` that are missing from `src/content/articles/`.
