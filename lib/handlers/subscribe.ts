import type { ApiRequest, ApiResponse } from '../http.js';
import { getClientIp, readBody } from '../http.js';
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS } from '../rate-limit.js';
import { logError } from '../errors.js';
import {
  clamp,
  esc,
  getNotifyEmail,
  getResend,
  isHoneypotTripped,
  isValidEmail,
} from '../email.js';
import { createConfirmToken, getSiteUrl, verifyConfirmToken } from '../subscribe-token.js';

/**
 * Newsletter subscribe — double opt-in, no open relay.
 *
 * POST /api/subscribe
 *   - Never sends a welcome blast to an unconfirmed address.
 *   - Sends a single confirmation link (rate-limited per IP and per email).
 *   - Always returns a generic success for valid-shaped requests so emails
 *     cannot be enumerated and bots always think they "won".
 *
 * GET /api/subscribe/confirm?token=...
 *   - Verifies HMAC token, creates Resend contact, then sends welcome once.
 */

const GENERIC_SUCCESS = {
  success: true as const,
  message: 'If that address is valid, check your inbox to confirm the subscription.',
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function sendRedirect(res: ApiResponse, url: string): void {
  // Express
  if (typeof (res as { redirect?: (code: number, u: string) => void }).redirect === 'function') {
    (res as { redirect: (code: number, u: string) => void }).redirect(302, url);
    return;
  }
  // Vercel / Node-style
  res.setHeader?.('Location', url);
  res.setHeader?.('Cache-Control', 'no-store');
  if (typeof (res as { end?: (body?: string) => void }).end === 'function') {
    (res as { statusCode?: number; end: (body?: string) => void }).statusCode = 302;
    (res as { end: (body?: string) => void }).end();
    return;
  }
  res.status(302).json({ redirect: url });
}

export async function handleSubscribe(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ip = getClientIp(req);
  const ipLimit = RATE_LIMITS.subscribe;
  const ipRl = checkRateLimit('subscribe:ip', ip, ipLimit);
  applyRateLimitHeaders(res, ipRl, ipLimit.max);
  if (!ipRl.ok) {
    // Still generic — don't teach attackers the limit shape via wording differences.
    res.status(200).json(GENERIC_SUCCESS);
    return;
  }

  const body = readBody<Record<string, unknown>>(req);

  if (isHoneypotTripped(body)) {
    res.status(200).json(GENERIC_SUCCESS);
    return;
  }

  const email = normalizeEmail(clamp(body.email, 200));
  if (!email || !isValidEmail(email)) {
    res.status(400).json({ error: 'Valid email is required' });
    return;
  }

  // Per-address cap: stops using many IPs to spam one inbox with confirm mails.
  const emailRl = checkRateLimit('subscribe:email', email, RATE_LIMITS['subscribe-email']);
  if (!emailRl.ok) {
    res.status(200).json(GENERIC_SUCCESS);
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    logError('subscribe', new Error('RESEND_API_KEY is not configured'));
    // Do not leak config state; same happy path copy.
    res.status(200).json(GENERIC_SUCCESS);
    return;
  }

  try {
    const token = createConfirmToken(email);
    const confirmUrl = `${getSiteUrl()}/api/subscribe/confirm?token=${encodeURIComponent(token)}`;
    const resend = getResend();

    const { error } = await resend.emails.send({
      from: 'Aditya Gaurav <aiexpert@adityaai.dev>',
      to: email,
      subject: 'Confirm your subscription — adityaai.dev',
      html: confirmEmailHtml(confirmUrl),
    });

    if (error) {
      logError('subscribe:confirm-mail', error);
      // Generic success to avoid email oracle / retry probing.
      res.status(200).json(GENERIC_SUCCESS);
      return;
    }

    res.status(200).json(GENERIC_SUCCESS);
  } catch (error: unknown) {
    logError('subscribe', error);
    res.status(200).json(GENERIC_SUCCESS);
  }
}

export async function handleSubscribeConfirm(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const site = getSiteUrl();
  const failUrl = `${site}/?subscribed=invalid`;
  const okUrl = `${site}/?subscribed=1`;
  const expiredUrl = `${site}/?subscribed=expired`;

  const token = extractToken(req);
  if (!token) {
    sendRedirect(res, failUrl);
    return;
  }

  const verified = verifyConfirmToken(token);
  if (!verified.ok) {
    sendRedirect(res, verified.reason === 'expired' ? expiredUrl : failUrl);
    return;
  }

  const email = verified.email;
  const confirmIp = getClientIp(req);
  const confirmRl = checkRateLimit('subscribe:confirm', `${confirmIp}:${email}`, {
    windowMs: 60 * 60 * 1000,
    max: 10,
  });
  if (!confirmRl.ok) {
    sendRedirect(res, failUrl);
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    logError('subscribe:confirm', new Error('RESEND_API_KEY is not configured'));
    sendRedirect(res, failUrl);
    return;
  }

  try {
    const resend = getResend();
    await createNewsletterContact(resend, email);

    // Welcome + owner notify at most once per email / 24h (token can be re-clicked).
    const welcomeRl = checkRateLimit('subscribe:welcome', email, {
      windowMs: 24 * 60 * 60 * 1000,
      max: 1,
    });
    if (welcomeRl.ok) {
      const { error: welcomeError } = await resend.emails.send({
        from: 'Aditya Gaurav <aiexpert@adityaai.dev>',
        to: email,
        subject: 'Welcome to the Newsletter! 👋',
        html: welcomeEmailHtml(),
      });
      if (welcomeError) {
        logError('subscribe:welcome', welcomeError);
      }

      const notifyTo = getNotifyEmail();
      const { error: notifyError } = await resend.emails.send({
        from: 'adityaai.dev <aiexpert@adityaai.dev>',
        to: notifyTo,
        subject: `New confirmed subscriber: ${email}`,
        html: `<p style="font-family:sans-serif">Confirmed newsletter subscriber: <strong>${esc(email)}</strong></p>`,
      });
      if (notifyError) {
        logError('subscribe:notify', notifyError);
      }
    }

    sendRedirect(res, okUrl);
  } catch (error: unknown) {
    logError('subscribe:confirm', error);
    sendRedirect(res, failUrl);
  }
}

function extractToken(req: ApiRequest): string {
  const q = req.query?.token;
  if (typeof q === 'string') return q;
  if (Array.isArray(q) && typeof q[0] === 'string') return q[0];

  // Some runtimes put query only on url
  const url = typeof req.url === 'string' ? req.url : '';
  if (url.includes('token=')) {
    try {
      const u = new URL(url, 'http://localhost');
      return u.searchParams.get('token') || '';
    } catch {
      /* ignore */
    }
  }

  const body = readBody<Record<string, unknown>>(req);
  if (typeof body.token === 'string') return body.token;
  return '';
}

function isBenignContactError(message: string | undefined): boolean {
  const msg = (message || '').toLowerCase();
  return (
    msg.includes('already') ||
    msg.includes('exist') ||
    msg.includes('duplicate') ||
    msg.includes('conflict')
  );
}

async function createNewsletterContact(
  resend: ReturnType<typeof getResend>,
  email: string,
): Promise<void> {
  const segmentId = process.env.RESEND_AUDIENCE_ID?.trim();

  // Modern Resend API: segments (audience IDs still work as segment IDs after migration).
  const primary = segmentId
    ? await resend.contacts.create({
        email,
        unsubscribed: false,
        segments: [{ id: segmentId }],
      })
    : await resend.contacts.create({
        email,
        unsubscribed: false,
      });

  if (!primary.error) return;
  if (isBenignContactError(primary.error.message)) return;

  // Legacy fallback: /audiences/:id/contacts
  if (segmentId) {
    const legacy = await resend.contacts.create({
      email,
      unsubscribed: false,
      audienceId: segmentId,
    });
    if (!legacy.error || isBenignContactError(legacy.error.message)) return;
    throw new Error(legacy.error.message || 'Failed to create contact');
  }

  throw new Error(primary.error.message || 'Failed to create contact');
}

function confirmEmailHtml(confirmUrl: string): string {
  const safeUrl = esc(confirmUrl);
  return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Confirm your subscription</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
            </style>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #fafafa; margin: 0; padding: 0;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #09090b; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #09090b; border: 1px solid #27272a; border-radius: 24px; margin: 0 auto; padding: 40px;">
                    <tr>
                      <td>
                        <div style="text-align: center; margin-bottom: 32px;">
                          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #CAFF4A;">adityaai.dev</span>
                        </div>
                        <h1 style="color: #fafafa; font-size: 24px; font-weight: 600; margin-top: 0; margin-bottom: 24px; text-align: center;">Confirm your subscription</h1>
                        <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;">
                          One click and you're on the list. Infrequent, high-signal notes on AI architecture and systems design.
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 32px; margin-bottom: 32px;">
                          <tr>
                            <td align="center">
                              <a href="${safeUrl}" style="background-color: #CAFF4A; color: #09090b; font-family: 'JetBrains Mono', monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; padding: 14px 28px; border-radius: 9999px; display: inline-block; font-weight: 600;">Confirm subscription</a>
                            </td>
                          </tr>
                        </table>
                        <p style="color: #71717a; font-size: 13px; line-height: 20px; margin: 0 0 16px 0;">
                          This link expires in 48 hours. If you didn't request this, ignore this email — nothing will be added.
                        </p>
                        <p style="color: #52525b; font-size: 12px; line-height: 18px; word-break: break-all; margin: 0; font-family: 'JetBrains Mono', monospace;">
                          ${safeUrl}
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;
}

function welcomeEmailHtml(): string {
  return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Welcome to the Newsletter</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap');
            </style>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #09090b; color: #fafafa; margin: 0; padding: 0;">
            <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #09090b; padding: 40px 0;">
              <tr>
                <td align="center">
                  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; background-color: #09090b; border: 1px solid #27272a; border-radius: 24px; margin: 0 auto; padding: 40px;">
                    <tr>
                      <td>
                        <div style="text-align: center; margin-bottom: 32px;">
                          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #CAFF4A;">adityaai.dev</span>
                        </div>
                        <h1 style="color: #fafafa; font-size: 24px; font-weight: 600; margin-top: 0; margin-bottom: 24px; text-align: center;">Welcome aboard.</h1>
                        <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;">
                          You're confirmed. Thanks for joining.
                        </p>
                        <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;">
                          You'll receive my latest articles, research, and thoughts on AI architecture and systems design — infrequent and high-signal.
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 40px; margin-bottom: 40px;">
                          <tr>
                            <td align="center">
                              <a href="https://www.adityaai.dev/articles" style="background-color: transparent; border: 1px solid #27272a; color: #a1a1aa; font-family: 'JetBrains Mono', monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; padding: 14px 28px; border-radius: 9999px; display: inline-block;">Read Latest Articles</a>
                            </td>
                          </tr>
                        </table>
                        <div style="border-top: 1px solid #27272a; padding-top: 32px; margin-top: 32px;">
                          <p style="color: #71717a; font-size: 14px; margin: 0; font-family: 'JetBrains Mono', monospace;">
                            Best regards,<br/><br/>
                            <strong style="color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Aditya Gaurav</strong><br/>
                            AI Researcher & Systems Architect
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #52525b; font-size: 12px; text-align: center; margin-top: 24px; font-family: 'JetBrains Mono', monospace;">
                    If you didn't request this email, you can safely ignore it.
                  </p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;
}
