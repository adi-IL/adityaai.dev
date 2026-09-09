# Project detail card

From `/projects`, a visitor opens a registry project (FRIDAY, Sentinel, or MidSphere) and reads the engineering write-up.

## Sub-features

- `list-to-detail` opens a project from its card.
- `detail-http` serves `/projects/<slug>` as 200 for registry slugs.
- `detail-demo-code` shows Demo and Code actions when present.

## How to get to it (user POV)

- On `/projects`, choose a project card.
- Open `/projects/friday`, `/projects/sentinel`, or `/projects/midsphere` directly.

## Driving it with verify-adityaai

Preconditions:

- Doctor is green.
- Registry still includes `friday`.

- **HTTP.** `node .cursor/skills/verify-adityaai/scripts/http-probe.mjs /projects/friday --expect-status 200`
- **Open card.** From `/projects`, activate the FRIDAY card link. URL contains `/projects/friday`. Write-up content is visible.
- **Proof.** Screenshot `$ADITYAAI_VERIFY_DIR/artifacts/project-detail/friday.png`. Note final URL in `notes.txt`.

## Gotchas

- External Demo/Code chips stop click propagation on the list card. Prefer the main card link for in-app detail.
- Do not document private GitHub URLs as public without a live 200 check (AGENTS.md).
