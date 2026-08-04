import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_TTL_SEC = 48 * 60 * 60; // 48 hours

function getSecret(): string {
  const secret = process.env.SUBSCRIBE_SECRET || process.env.RESEND_API_KEY;
  if (!secret) {
    throw new Error('SUBSCRIBE_SECRET or RESEND_API_KEY is required to sign confirm tokens');
  }
  return secret;
}

function b64url(input: string | Buffer): string {
  const buf = typeof input === 'string' ? Buffer.from(input, 'utf8') : input;
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromB64url(input: string): Buffer {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4));
  const b64 = input.replace(/-/g, '+').replace(/_/g, '/') + pad;
  return Buffer.from(b64, 'base64');
}

function sign(payload: string): string {
  return b64url(createHmac('sha256', getSecret()).update(payload).digest());
}

/**
 * Stateless double-opt-in token: email + expiry, HMAC-signed.
 * Format: base64url(email|exp).signature
 */
export function createConfirmToken(email: string, nowSec = Math.floor(Date.now() / 1000)): string {
  const normalized = email.trim().toLowerCase();
  const exp = nowSec + TOKEN_TTL_SEC;
  const payload = `${normalized}|${exp}`;
  return `${b64url(payload)}.${sign(payload)}`;
}

export function verifyConfirmToken(
  token: string,
  nowSec = Math.floor(Date.now() / 1000),
): { ok: true; email: string } | { ok: false; reason: string } {
  if (!token || token.length > 600) {
    return { ok: false, reason: 'invalid' };
  }
  const parts = token.split('.');
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, reason: 'invalid' };
  }
  const [payloadB64, sig] = parts;
  let payload: string;
  try {
    payload = fromB64url(payloadB64).toString('utf8');
  } catch {
    return { ok: false, reason: 'invalid' };
  }

  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'invalid' };
  }

  const sep = payload.lastIndexOf('|');
  if (sep <= 0) return { ok: false, reason: 'invalid' };
  const email = payload.slice(0, sep).trim().toLowerCase();
  const exp = Number(payload.slice(sep + 1));
  if (!email || !Number.isFinite(exp)) return { ok: false, reason: 'invalid' };
  if (nowSec > exp) return { ok: false, reason: 'expired' };

  return { ok: true, email };
}

export function getSiteUrl(): string {
  const raw = process.env.APP_URL || process.env.SITE_URL || 'https://www.adityaai.dev';
  return raw.replace(/\/+$/, '');
}

export { TOKEN_TTL_SEC };
