# Projects Upstream strip

`/projects` lists shipped products, then a section titled Critical impacts in open source with four static upstream receipts (Issue on one line, Fix under it, Inspect link).

## Sub-features

- `upstream-heading` shows Critical impacts in open source below the project cards.
- `upstream-row-shape` shows repo, PR number, Issue line, Fix line, and Inspect for each receipt.
- `upstream-inspect` opens the matching GitHub pull request in a new tab or window.
- `upstream-llms` keeps `llms.txt` in sync with the same four receipts.

## How to get to it (user POV)

- Open `/projects` and scroll below the project cards.
- Choose Projects in the nav, then scroll to the strip.
- Read `https://www.adityaai.dev/llms.txt` for the static inventory text.

## Driving it with verify-adityaai

Preconditions:

- Doctor is green.
- Feature map expects these four PRs (order locked): tensorflow#125859, tensorflow#126449, google/mug#130, grafana#131335.

- **Open strip.** Navigate to `$ADITYAAI_BASE_URL/projects`. Scroll until heading `Critical impacts in open source` is visible.
- **Row shape.** For `tensorflow/tensorflow #125859`, confirm an `Issue` line and a `Fix` line stacked. Confirm an `Inspect` control.
- **Inspect.** Activate `Inspect` on grafana#131335. Destination host is `github.com` and path contains `/grafana/grafana/pull/131335`.
- **llms.txt.** Run `node .cursor/skills/verify-adityaai/scripts/http-probe.mjs /llms.txt --grep "Critical impacts in open source" --grep "125859"`. Exit `0`.
- **Proof.** Screenshot the strip to `$ADITYAAI_VERIFY_DIR/artifacts/projects-upstream/strip.png`. Note the four PR numbers in `notes.txt`.

## Gotchas

- Data is static in `src/lib/upstream.ts`. There is no live GitHub API on the page.
- About must not show this strip.
- Do not treat open or approved-but-unmerged TensorFlow PRs as site receipts.
