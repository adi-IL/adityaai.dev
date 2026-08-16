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

Lab guide chatbot powered by Google Vertex AI / Gemini (`gemini-3.7-flash` by default, configurable via `GEMINI_MODEL`, `temperature: 0.4`, `maxOutputTokens: 1024`).

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

- `functionCalls`: Optional array of client-side tool executions (e.g. `navigateTo`). If the model emits a tool call with no text, the handler auto-generates a fallback reply (`Navigating to {path}...`).
- `sources`: Only present when search grounding returned citations.

### Errors

| Status | Meaning |
| --- | --- |
| 400 | Invalid messages |
| 405 | Method not allowed (only POST is accepted) |
| 429 | Rate limited (~20 req/hour/IP) |
| 500 / 502 | Model/upstream failure (generic message) |

### Limits

- Rate limit: 20 requests / hour / IP (in-memory).
- Max history: 12 messages.
- Max content length: 2,000 characters per message.

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

### Errors

| Status | Meaning |
| --- | --- |
| 400 | Invalid email shape or format |
| 405 | Method not allowed (only POST is accepted) |
| 429 | Rate limited (5 req/hour/IP) |
| 500 | Internal or email provider error |

### Limits

- Rate limit: 5 requests / hour / IP.

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

### Limits

- Rate limit: 2 confirmations per 24 hours per email address.

---

## `POST /api/virtual-coffee`

Lead form.

### Request

```json
{
  "name": "Ada",
  "email": "ada@example.com",
  "role": "Engineer @ Acme (optional)",
  "message": "Want to talk agents (optional)",
  "website": ""
}
```

| Field | Requirement | Notes |
| --- | --- | --- |
| `name` | Required | Truncated to 100 chars |
| `email` | Required | Valid email shape, truncated to 150 chars |
| `role` | Optional | Truncated to 100 chars |
| `message` | Optional | Truncated to 2,000 chars |
| `website` | Optional | Honeypot field |

### Response `200`

```json
{ "success": true }
```

Sends owner notification + visitor confirmation via Resend.

### Errors

| Status | Meaning |
| --- | --- |
| 400 | Missing name or invalid email |
| 405 | Method not allowed (only POST is accepted) |
| 429 | Rate limited (5 req/hour/IP) |
| 500 | Email provider or internal failure |

### Limits

- Rate limit: 5 requests / hour / IP.

---

## `POST /api/feedback`

Article reactions.

### Request

```json
{
  "slug": "memory-stacks-for-agents",
  "title": "Memory Stacks…",
  "reaction": "insightful",
  "comment": "optional feedback",
  "email": "optional@example.com",
  "website": ""
}
```

`reaction` allowlist: `insightful` | `useful` | `needs-depth`.

### Response `200`

```json
{ "success": true }
```

### Errors

| Status | Meaning |
| --- | --- |
| 400 | Missing slug or disallowed reaction value |
| 405 | Method not allowed (only POST is accepted) |
| 429 | Rate limited (15 req/hour/IP) |
| 500 | Email provider or internal failure |

### Limits

- Rate limit: 15 requests / hour / IP.
- Global API burst rate limit: 30 requests / minute / IP across all endpoints.

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
