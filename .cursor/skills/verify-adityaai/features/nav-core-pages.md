# Navigation and core pages

A visitor can move between Home, Essays, Projects, Upstream, and About through the top nav or direct URLs and land on the matching page chrome.

## Sub-features

- `nav-home` opens `/` and shows the Home experience.
- `nav-essays` opens `/articles` from the Essays link.
- `nav-projects` opens `/projects` from the Projects link.
- `nav-upstream` opens `/upstream` from the Upstream link.
- `nav-about` opens `/about` from the About link.
- `nav-http` confirms each core path returns HTTP 200.

## How to get to it (user POV)

- Choose `Home`, `Essays`, `Projects`, `Upstream`, or `About` in the desktop pill nav.
- On narrow screens, open the menu with `Open navigation menu`, then choose a link.
- Type the path in the address bar.

## Driving it with verify-adityaai

Preconditions:

- Doctor is green for `ADITYAAI_BASE_URL`.
- Browser viewport is desktop-width for the pill nav.

- **HTTP core.** Run `node .cursor/skills/verify-adityaai/scripts/http-probe.mjs /` and the same for `/articles`, `/projects`, `/upstream`, `/about`. Each reports status `200`.
- **Home.** Open `$ADITYAAI_BASE_URL/`. Screenshot to `$ADITYAAI_VERIFY_DIR/artifacts/nav-core-pages/home.png`.
- **Essays via nav.** Choose link `Essays`. URL ends with `/articles`. Screenshot `essays.png`.
- **Projects via nav.** Choose link `Projects`. URL ends with `/projects`. Screenshot `projects.png`.
- **Upstream via nav.** Choose link `Upstream`. URL ends with `/upstream`. Screenshot `upstream.png`.
- **About via nav.** Choose link `About`. URL ends with `/about`. Heading `About` is visible. Screenshot `about.png`.
- **Proof.** Write `$ADITYAAI_VERIFY_DIR/artifacts/nav-core-pages/notes.txt` listing each click and final URL.

## Gotchas

- The Essays nav path is `/articles`, not `/essays`.
- Mobile hides the pill nav. Use `Open navigation menu` or go by URL.
- Motion transitions briefly animate opacity. Wait for the heading before asserting.
