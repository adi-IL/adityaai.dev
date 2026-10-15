---
name: verify-adityaai
description: Drive www.adityaai.dev (Vite + React SPA) like a visitor. HTTP doctor, browser navigation, and proof artifacts. Use when proving site changes, SEO redirects/404s, Projects Upstream strip, or essay/project pages before claiming done.
---

# verify-adityaai

Verification control skill for **adityaai.dev**. Primary surface is the public web UI. Secondary surface is static brand files and serverless APIs (newsletter, coffee, feedback, chat). Agents read this cold mid-task.

Live production: `https://www.adityaai.dev`  
Local default: `http://127.0.0.1:3000` after `npm run dev`

## Launch

### Production (preferred for deploy proofs)

No local process. Set:

```bash
export ADITYAAI_BASE_URL=https://www.adityaai.dev
export ADITYAAI_VERIFY_DIR="${ADITYAAI_VERIFY_DIR:-/tmp/adityaai-verify-$RANDOM}"
mkdir -p "$ADITYAAI_VERIFY_DIR/artifacts"
```

Ready when `curl -sS -o /dev/null -w '%{http_code}' "$ADITYAAI_BASE_URL/"` prints `200`.

### Local

From the repo root (needs Node >= 20):

```bash
export ADITYAAI_VERIFY_DIR="${ADITYAAI_VERIFY_DIR:-/tmp/adityaai-verify-$RANDOM}"
mkdir -p "$ADITYAAI_VERIFY_DIR/artifacts"
npm install
npm run dev
echo $! > "$ADITYAAI_VERIFY_DIR/server.pid"
```

Ready when `curl -sS -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/` is `200`.

Record the PID you started. Teardown kills **only that PID** (see Cleanup). Never `pkill -f` vite/tsx/node (AGENTS.md).

Only one default local port (`3000` in `server.ts`). Do not drive a shared instance you did not start.

## Doctor

Read-only health. Run first whenever anything looks off.

```bash
node .cursor/skills/verify-adityaai/scripts/doctor.mjs
ADITYAAI_BASE_URL=https://www.adityaai.dev node .cursor/skills/verify-adityaai/scripts/doctor.mjs
```

Doctor must exit `0` and print `ok` lines for:

1. `GET /` → 200
2. `GET /projects` → 200
3. `GET /articles` → 200
4. `GET /about` → 200
5. `GET /upstream` → 200
6. `GET /essays` → permanent redirect to `/articles` (308 or 301; follow off)
7. `GET /articles/does-not-exist-verify-adityaai` → 404 (hard, not soft-200)
8. `GET /llms.txt` → 200 and body contains `adityaai.dev`
9. `GET /sitemap.xml` → 200 and body contains `www.adityaai.dev`

If doctor fails, stop. Fix the site or the base URL before driving UI.

## Drive

### HTTP harness

```bash
node .cursor/skills/verify-adityaai/scripts/http-probe.mjs /projects
```

### Browser harness

Drive the real visitor path in a desktop/browser subagent. Prefer:

- Desktop viewport wide enough for the pill nav. Links named `Home`, `Essays`, `Projects`, `About`.
- Mobile: `Open navigation menu` / `Close navigation menu`.
- Direct route URLs for deep links.
- Stable text anchors, not coordinates.
- Do not submit newsletter, coffee, feedback, or chat in default proof.

Feature recipes live under `features/`. Read `features/README.md` first.

## Evidence

Put proof under `$ADITYAAI_VERIFY_DIR/artifacts/<feature-id>/`. Keep it after cleanup.

- Exercise the visitor path, not internal React setters.
- Capture action and resulting state.
- HTTP: status, Location, body excerpt.
- UI: screenshot with site identity visible plus notes.
- Mutations only when the owner asked.

Named locations:

- `$ADITYAAI_VERIFY_DIR/artifacts/doctor.log`
- `$ADITYAAI_VERIFY_DIR/artifacts/<feature-id>/*.png`
- `$ADITYAAI_VERIFY_DIR/artifacts/<feature-id>/notes.txt`

## Cleanup

```bash
node .cursor/skills/verify-adityaai/scripts/cleanup.mjs
```

Stops the local PID in `$ADITYAAI_VERIFY_DIR/server.pid` only. Never deletes artifacts. Never kills by process name pattern.

## Helpers

| Script | Purpose |
| --- | --- |
| `scripts/doctor.mjs` | Read-only HTTP health |
| `scripts/http-probe.mjs` | One-path status / redirect / body check |
| `scripts/cleanup.mjs` | Kill recorded local server PID only |

## Maintain

When routes, Upstream receipts, or essay inventory change, update the feature map with `/maintain-verification-skill`.
