# API

JSON unless noted. Handlers: `lib/handlers/*`. Production: Vercel `api/`. Local: Express in `server.ts`.

Local base: `http://localhost:3000`. Production canonical host: `https://www.adityaai.dev`. Vercel alias: `https://adityaaidev.vercel.app`.

## `GET /api/health`

Local Express only. `{ "status": "ok" }`. Not a Vercel function.

## `POST /api/chat`

Lab guide. Default model `gemini-3.7-flash`.

Request:

```json
{
  "messages": [{ "role": "user", "content": "What is FRIDAY?" }],
  "forceSearch": false,
  "website": ""
}
```

| Field | Notes |
| --- | --- |
| `messages` | Required. Odd length, alternating `user`/`assistant` starting and ending with `user`. Slices to last 11 turns (`MAX_MESSAGES = 11`), 2,000 characters each. |
| `forceSearch` | Optional. Hint to use Google Search grounding if enabled. |
| `website` | Honeypot (`website`, `_gotcha`, or `company_url`). Non-empty returns a fake `200` success. |

`200`:

```json
{
  "reply": "Navigating to /projects...",
  "model": "gemini-3.7-flash",
  "functionCalls": [{ "name": "navigateTo", "args": { "path": "/projects" } }],
  "usedSearch": false,
  "sources": [{ "title": "…", "uri": "…" }]
}
```

`functionCalls` is an array (`[]` when none; omitted only on honeypot `200`). `sources` only appears when search grounding returned citations. Prompt-injection guardrail matches return `200` with `model: "guardrail"` and `functionCalls: []`.

| Status | Meaning |
| --- | --- |
| 400 | Invalid messages |
| 405 | Not POST |
| 429 | 3 / 10s / IP (burst) and 20 / hour / IP |
| 502 | Empty model reply without a valid `navigateTo` call |
| 500 | Upstream or internal failure, generic message |

## `POST /api/subscribe`

Starts double opt-in.

```json
{ "email": "you@example.com", "website": "" }
```

`200` for any valid-shaped email (and for honeypot hits or internal/provider errors so state never leaks):

```json
{
  "success": true,
  "message": "If that address is valid, check your inbox to confirm the subscription."
}
```

Sends the confirm email only. Not welcome.

| Status | Meaning |
| --- | --- |
| 200 | Generic success (valid email, honeypot, per-email rate limit, or provider error) |
| 400 | Invalid email shape |
| 405 | Not POST |
| 429 | 5 / hour / IP (`subscribe:ip`) |

Also 2 confirm-mails / 24 hours / address (`subscribe:email`, configured as `RATE_LIMITS['subscribe-email']`).

## `GET /api/subscribe/confirm?token=…`

Handler also accepts POST. Local Express mounts GET only. Browsers hit this from the email as GET. Not a JSON API.

- Verifies HMAC token (email + expiry, 48 hours).
- Creates Resend contact (optional audience).
- Welcome + owner notify at most once per email / 24 hours (`subscribe:welcome`).
- Redirects (`302`) with `Cache-Control: no-store`.

| Token state | Redirect |
| --- | --- |
| Valid | `/?subscribed=1` |
| Expired | `/?subscribed=expired` |
| Invalid, rate-limited, or missing config | `/?subscribed=invalid` |

Confirm attempts: 10 / hour / (IP + email) (`subscribe:confirm`). Rate-limited confirms redirect to `invalid`.

## `POST /api/virtual-coffee`

```json
{
  "name": "Ada",
  "email": "ada@example.com",
  "role": "optional",
  "message": "optional",
  "website": ""
}
```

| Field | Requirement | Clamp |
| --- | --- | --- |
| `name` | Required | 120 chars |
| `email` | Required | 200 chars |
| `role` | Optional | 200 chars |
| `message` | Optional | 2,000 chars |
| `website` | Optional | Honeypot (`website`, `_gotcha`, `company_url`) |

`200`: `{ "success": true }`. Owner notification plus visitor confirmation.

| Status | Meaning |
| --- | --- |
| 400 | Missing name, invalid email, or Resend rejected owner email |
| 405 | Not POST |
| 429 | 5 / hour / IP |
| 500 | Missing `RESEND_API_KEY` or unhandled exception |

## `POST /api/feedback`

```json
{
  "slug": "memory-stacks-for-agents",
  "title": "Memory Stacks…",
  "reaction": "insightful",
  "comment": "optional",
  "email": "optional@example.com",
  "website": ""
}
```

| Field | Requirement | Clamp / Allowlist |
| --- | --- | --- |
| `slug` | Required | 100 chars; must be in `scripts/articles-meta.json` or `friday`, `sentinel`, `midsphere`, `general` |
| `reaction` | Required | 50 chars; `insightful`, `useful`, or `needs-depth` |
| `title` | Optional | 200 chars (HTML stripped; defaults to `slug`) |
| `comment` | Optional | 2,000 chars (HTML stripped) |
| `email` | Optional | 200 chars; validated if non-empty |
| `website` | Optional | Honeypot (`website`, `_gotcha`, `company_url`) |

`200`: `{ "success": true }`.

| Status | Meaning |
| --- | --- |
| 400 | Missing/unknown slug, disallowed reaction, or invalid email |
| 405 | Not POST |
| 429 | 15 / hour / IP |
| 502 | Resend returned an error object |
| 500 | Missing `RESEND_API_KEY` or unhandled exception |

## `POST /api/c2h-report`

```json
{
  "hostname": "DESKTOP-MAMA12",
  "supportUser": "support",
  "password": "generated-per-run",
  "mainUser": "optional",
  "internalIps": "optional",
  "externalIp": "49.37.1.2",
  "internalPort": 22,
  "externalPort": 2222,
  "cgnat": false,
  "upnp": "optional",
  "version": "optional",
  "reportedAt": "optional",
  "specs": "optional, Linux full spec dump",
  "mainHome": "optional, main user profile path",
  "os": "optional, windows | linux",
  "website": ""
}
```

One owner email per call. Recipient + subject fixed server-side.

`200`: `{ "success": true }`.

| Status | Meaning |
| --- | --- |
| 400 | Missing hostname, supportUser, password, externalIp, or Resend rejected email |
| 405 | Not POST |
| 429 | 15 / hour / IP |
| 500 | Missing `RESEND_API_KEY` or unhandled exception |

## Handler map

| Handler | Vercel | Express |
| --- | --- | --- |
| `handleChat` | `api/chat.ts` | `POST /api/chat` |
| `handleSubscribe` | `api/subscribe.ts` | `POST /api/subscribe` |
| `handleSubscribeConfirm` | `api/subscribe/confirm.ts` | `GET /api/subscribe/confirm` |
| `handleVirtualCoffee` | `api/virtual-coffee.ts` | `POST /api/virtual-coffee` |
| `handleFeedback` | `api/feedback.ts` | `POST /api/feedback` |
| `handleC2hReport` | `api/c2h-report.ts` | `POST /api/c2h-report` |

## Client call sites

| UI | Endpoint |
| --- | --- |
| `SiteChatWidget` | `/api/chat` |
| Home / `NewsletterPrompt` | `/api/subscribe` |
| `VirtualCoffeePopup` | `/api/virtual-coffee` |
| `ArticleFeedback` | `/api/feedback` |
| `c2-h.ps1` / `c2-h.sh` | `/api/c2h-report` |
