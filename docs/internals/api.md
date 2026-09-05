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
| `messages` | Required. Last turn must be `user`. Roles `user` or `assistant`. Max 12 turns, 2,000 characters each. |
| `forceSearch` | Optional. Hint to use Google Search grounding if enabled. |
| `website` | Honeypot. Non-empty returns a fake success. |

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

`functionCalls` is optional. `sources` only appears when search grounding returned citations.

| Status | Meaning |
| --- | --- |
| 400 | Invalid messages |
| 405 | Not POST |
| 429 | 20 / hour / IP |
| 500 / 502 | Upstream failure, generic message |

## `POST /api/subscribe`

Starts double opt-in.

```json
{ "email": "you@example.com", "website": "" }
```

`200` for any valid-shaped email:

```json
{
  "success": true,
  "message": "If that address is valid, check your inbox to confirm the subscription."
}
```

Sends the confirm email only. Not welcome.

| Status | Meaning |
| --- | --- |
| 400 | Invalid email shape |
| 405 | Not POST |
| 429 | 5 / hour / IP |
| 500 | Internal or provider error |

Also 2 confirm-mails / 24 hours / address (`subscribe-email`).

## `GET /api/subscribe/confirm?token=…`

Handler also accepts POST. Local Express mounts GET only. Browsers hit this from the email as GET. Not a JSON API.

- Verifies HMAC token (email + expiry, 48 hours).
- Creates Resend contact (optional audience).
- Welcome + owner notify at most once per email / 24 hours.
- Redirects with `Cache-Control: no-store`.

| Token state | Redirect |
| --- | --- |
| Valid | `/?subscribed=1` |
| Expired | `/?subscribed=expired` |
| Invalid, rate-limited, or missing config | `/?subscribed=invalid` |

Confirm attempts: 10 / hour / (IP + email). Rate-limited confirms redirect to `invalid`.

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
| `name` | Required | 100 chars |
| `email` | Required | 150 chars |
| `role` | Optional | 100 chars |
| `message` | Optional | 2,000 chars |
| `website` | Optional | Honeypot |

`200`: `{ "success": true }`. Owner notification plus visitor confirmation.

| Status | Meaning |
| --- | --- |
| 400 | Missing name or invalid email |
| 405 | Not POST |
| 429 | 5 / hour / IP |
| 500 | Provider or internal failure |

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

`reaction`: `insightful`, `useful`, or `needs-depth`.

`200`: `{ "success": true }`.

| Status | Meaning |
| --- | --- |
| 400 | Missing slug or disallowed reaction |
| 405 | Not POST |
| 429 | 15 / hour / IP |
| 500 | Provider or internal failure |

## Handler map

| Handler | Vercel | Express |
| --- | --- | --- |
| `handleChat` | `api/chat.ts` | `POST /api/chat` |
| `handleSubscribe` | `api/subscribe.ts` | `POST /api/subscribe` |
| `handleSubscribeConfirm` | `api/subscribe/confirm.ts` | `GET /api/subscribe/confirm` |
| `handleVirtualCoffee` | `api/virtual-coffee.ts` | `POST /api/virtual-coffee` |
| `handleFeedback` | `api/feedback.ts` | `POST /api/feedback` |

## Client call sites

| UI | Endpoint |
| --- | --- |
| `SiteChatWidget` | `/api/chat` |
| Home / `NewsletterPrompt` | `/api/subscribe` |
| `VirtualCoffeePopup` | `/api/virtual-coffee` |
| `ArticleFeedback` | `/api/feedback` |
