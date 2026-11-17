# Projects upstream strip

`/projects` lists shipped products, then a section titled Critical impacts in open source with four static upstream receipts, one line each. The full Issue and Fix account lives on `/upstream`, on the matching rows of the PR ledger. The two pages are joined by pull request URL.

## Sub-features

- `upstream-heading` shows Critical impacts in open source below the project cards.
- `upstream-row-shape` shows one line per receipt: repo chip, PR number, the receipt's one-line summary, and a `test` mark when the joined ledger row ships a regression test.
- `upstream-row-link` makes the whole row open the matching GitHub pull request in a new tab or window. There is no `Inspect` control.
- `upstream-ledger-account` renders the receipt's Issue and Fix prose on the matching `/upstream` ledger rows, marked by a lime `Receipt` chip.
- `upstream-ledger-link` points from the strip to `the upstream ledger`, and the Open-source impact tile links there too.
- `upstream-join` pairs receipts to ledger rows in `src/lib/upstreamLedger.ts` by pull request URL. `receiptRows` keeps a receipt with `pr: null` when the ledger has no row.
- `upstream-llms` keeps `llms.txt` in sync with the same four receipts.

## How to get to it (user POV)

- Open `/projects` and scroll below the project cards.
- Choose Projects in the nav, then scroll to the strip.
- Choose Upstream in the nav to read the Issue and Fix account on the ledger rows.
- Read `https://www.adityaai.dev/llms.txt` for the static inventory text.

## Driving it with verify-adityaai

Preconditions:

- Doctor is green.
- Feature map expects these four PRs (order locked): gvisor#14401, tensorflow#127438, tensorflow#126688, gvisor#15301.
- Two of the four ship a regression test in the ledger: tensorflow#127438 and tensorflow#126688.

- **Open strip.** Navigate to `$ADITYAAI_BASE_URL/projects`. Scroll until heading `Critical impacts in open source` is visible.
- **Row shape.** For `google/gvisor #14401`, confirm one line carrying the repo chip, `#14401`, and a one-line summary. Confirm no `Issue` or `Fix` prose and no `Inspect` control.
- **Test mark.** Confirm a lime `test` mark on `tensorflow/tensorflow #127438` and `tensorflow/tensorflow #126688`, and none on `google/gvisor #14401` or `google/gvisor #15301`.
- **Row link.** Activate the `google/gvisor #15301` row. Destination host is `github.com` and path contains `/google/gvisor/pull/15301`.
- **Ledger link.** Activate `the upstream ledger`. The page lands on `/upstream`.
- **Open ledger.** Navigate to `$ADITYAAI_BASE_URL/upstream`. In the PR ledger list, confirm a lime `Receipt` chip on the four rows, and an `Issue` line and a `Fix` line under each matching PR title, above the `Proof:` line.
- **llms.txt.** Run `node .cursor/skills/verify-adityaai/scripts/http-probe.mjs /llms.txt --grep "Critical impacts in open source" --grep "14401"`. Exit `0`.
- **Proof.** Screenshot the strip to `$ADITYAAI_VERIFY_DIR/artifacts/projects-upstream/strip.png` and the four ledger rows to `$ADITYAAI_VERIFY_DIR/artifacts/projects-upstream/ledger.png`. Note the four PR numbers in `notes.txt`.

## Gotchas

- Data is static in `src/lib/upstream.ts`. There is no live GitHub API on either page.
- `src/lib/upstream.ts` must stay import-free; `scripts/prerender.mjs` loads it through a `data:` URL. The join lives in `src/lib/upstreamLedger.ts`.
- About must not show this strip.
- Do not treat open or approved-but-unmerged TensorFlow PRs as site receipts.
