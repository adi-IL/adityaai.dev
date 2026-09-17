import { Resend } from 'resend';

let resendClient: Resend | null = null;

export function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      throw new Error('RESEND_API_KEY environment variable is required');
    }
    resendClient = new Resend(key);
  }
  return resendClient;
}

export function getNotifyEmail(): string {
  return process.env.NOTIFY_EMAIL || 'aiexpert@adityaai.dev';
}

/** HTML-escape user-controlled strings before embedding in email HTML. */
export function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const EMAIL_RE =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string' || email.length > 254) return false;
  return EMAIL_RE.test(email);
}

export function stripHtml(s: string): string {
  let cleaned = s;
  let prev = '';
  while (cleaned !== prev) {
    prev = cleaned;
    cleaned = cleaned.replace(/<[^>]*>/g, '');
  }
  return cleaned.replace(/[<>]/g, '').trim();
}

/**
 * Honeypot: bots fill hidden fields. Legitimate users leave them empty.
 * If filled, treat as success without sending mail.
 */
export function isHoneypotTripped(body: Record<string, unknown>): boolean {
  const bait = body.website ?? body._gotcha ?? body.company_url;
  return typeof bait === 'string' && bait.trim().length > 0;
}

export function clamp(value: unknown, max: number): string {
  if (value == null) return '';
  return String(value).trim().slice(0, max);
}
