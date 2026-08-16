# API reference

All routes are JSON unless noted. Shared handlers: `lib/handlers/*`.  
Production: Vercel serverless under `api/`. Local: Express in `server.ts`.

Base (prod): `https://adityaaidev.vercel.app` or your custom domain.  
Base (local): `http://localhost:3000`.

---

## `GET /api/health`

| | |
| --- | --- |
| **Availability** | **Local Express only** (`server.ts`) |
| **Response** | `{ "status": "ok" }` |

Not deployed as a Vercel function unless you add `api/health.ts`.

---

## `POST /api/chat`

Lab guide chatbot (Vertex AI / Gemini).

### Request

```json
{
  "messages": [
    { "role": "user", "content": "What is FRIDAY?" }
  ],
  "forceSearch": false,
  "website": ""
}
```

| Field | Notes |
| --- | --- |
| `messages` | Required. Ends with a `user` turn. Roles: `user` \| `assistant`. Max ~12 turns, ~2k chars each. |
| `forceSearch` | Optional. Hint to use Google Search grounding if enabled. |
| `website` | Honeypot; non-empty → fake success. |

### Response `200`

```json
{
  "reply": "Navigating to /projects...",
  "functionCalls": [
    {
      "name": "navigateTo",
      "args": { "path": "/projects" }
    }
  ],
  "usedSearch": false,
  "sources": [{ "title": "…", "uri": "…" }]
}
```

- `functionCalls`: Optional array of client-side tool executions (e.g. `navigateTo`).
- `sources`: Only present when search grounding returned citations.

### Errors

| Status | Meaning |
| --- | --- |
| 400 | Invalid messages |
| 429 | Rate limited |
| 500 / 502 | Model/upstream failure (generic message) |

### Limits

~20 requests / hour / IP (in-memory).

---

## `POST /api/subscribe`

Start newsletter double opt-in.

### Request

```json
{ "email": "you@example.com", "website": "" }
```

### Response `200`

```json
{
  "success": true,
  "message": "If that address is valid, check your inbox to confirm the subscription."
}
```

Always generic success for valid-shaped emails (no email oracle). Sends **confirm** email only, not welcome.

---

## `GET /api/subscribe/confirm?token=…`

### Behavior

- Verifies HMAC token (email + expiry).
- Creates Resend contact (optional audience).
- Sends welcome + owner notify (at most once per email / 24h).
- **Redirects** to site `/?subscribed=1` (or `invalid` / `expired` flags) with `Cache-Control: no-store`.

Accepts `GET` or `POST` (browsers click from email as `GET`). Not a JSON API for browsers.

### Redirect targets

| Token state | Redirect |
| --- | --- |
| Valid | `/?subscribed=1` |
| Expired (>48h) | `/?subscribed=expired` |
| Invalid / rate-limited / config error | `/?subscribed=invalid` |

Note: confirmation (and all email delivery) is async from the browser's perspective - no JSON is returned.

---

## `POST /api/virtual-coffee`

Lead form.

### Request

```json
{
  "name": "Ada",
  "email": "ada@example.com",
  "role": "Engineer @ Acme",
  "message": "Want to talk agents",
  "website": ""
}
```

### Response `200`

```json
{ "success": true }
```

Sends owner notification + visitor confirmation via Resend.

---

## `POST /api/feedback`

Article reactions.

### Request

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

`reaction` allowlist: `insightful` | `useful` | `needs-depth`.

### Response `200`

```json
{ "success": true }
```

---

## Handler ↔ entry map

| Handler | Vercel entry | Express |
| --- | --- | --- |
| `handleChat` | `api/chat.ts` | `POST /api/chat` |
| `handleSubscribe` | `api/subscribe.ts` | `POST /api/subscribe` |
| `handleSubscribeConfirm` | `api/subscribe/confirm.ts` | `GET /api/subscribe/confirm` |
| `handleVirtualCoffee` | `api/virtual-coffee.ts` | `POST /api/virtual-coffee` |
| `handleFeedback` | `api/feedback.ts` | `POST /api/feedback` |

---

## Client call sites

| UI | Endpoint |
| --- | --- |
| `SiteChatWidget` | `/api/chat` |
| Home / `NewsletterPrompt` | `/api/subscribe` |
| `VirtualCoffeePopup` | `/api/virtual-coffee` |
| `ArticleFeedback` | `/api/feedback` |
