/**
 * Best-effort in-memory sliding-window rate limiter.
 *
 * Works fully for the long-lived Express server. On Vercel serverless it is
 * per-isolate (still stops noisy single-instance floods). Prefer Upstash/KV
 * later for multi-region hard limits.
 */

export type RateLimitResult =
  | { ok: true; remaining: number; resetMs: number }
  | { ok: false; remaining: 0; resetMs: number; retryAfterSec: number };

type Bucket = { timestamps: number[] };

const stores = new Map<string, Map<string, Bucket>>();

function getStore(namespace: string): Map<string, Bucket> {
  let store = stores.get(namespace);
  if (!store) {
    store = new Map();
    stores.set(namespace, store);
  }
  return store;
}

export function checkRateLimit(
  namespace: string,
  key: string,
  { windowMs, max }: { windowMs: number; max: number },
): RateLimitResult {
  const now = Date.now();
  const store = getStore(namespace);
  const bucket = store.get(key) || { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => now - t < windowMs);

  if (bucket.timestamps.length >= max) {
    const oldest = bucket.timestamps[0] ?? now;
    const resetMs = oldest + windowMs;
    store.set(key, bucket);
    return {
      ok: false,
      remaining: 0,
      resetMs,
      retryAfterSec: Math.max(1, Math.ceil((resetMs - now) / 1000)),
    };
  }

  bucket.timestamps.push(now);
  store.set(key, bucket);

  // Opportunistic cleanup for idle keys
  if (store.size > 5000) {
    for (const [k, b] of store) {
      b.timestamps = b.timestamps.filter((t) => now - t < windowMs);
      if (b.timestamps.length === 0) store.delete(k);
    }
  }

  return {
    ok: true,
    remaining: Math.max(0, max - bucket.timestamps.length),
    resetMs: now + windowMs,
  };
}

/** Route-specific defaults for public email endpoints. */
export const RATE_LIMITS = {
  subscribe: { windowMs: 60 * 60 * 1000, max: 5 }, // 5 confirm-mails / hour / IP
  'subscribe-email': { windowMs: 24 * 60 * 60 * 1000, max: 2 }, // 2 / day / address
  'virtual-coffee': { windowMs: 60 * 60 * 1000, max: 5 },
  feedback: { windowMs: 60 * 60 * 1000, max: 15 },
  chat: { windowMs: 60 * 60 * 1000, max: 20 }, // lab guide chatbot
  api: { windowMs: 60 * 1000, max: 30 }, // global API burst
} as const;

export function applyRateLimitHeaders(
  res: { setHeader?: (name: string, value: string) => void },
  result: RateLimitResult,
  max: number,
): void {
  if (!res.setHeader) return;
  res.setHeader('X-RateLimit-Limit', String(max));
  res.setHeader('X-RateLimit-Remaining', String(result.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetMs / 1000)));
  if (!result.ok) {
    res.setHeader('Retry-After', String(result.retryAfterSec));
  }
}
