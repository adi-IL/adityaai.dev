import type { ApiRequest, ApiResponse } from '../http.js';
import { getClientIp, readBody } from '../http.js';
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS } from '../rate-limit.js';
import { logError, publicErrorMessage } from '../errors.js';
import { clamp, esc, getNotifyEmail, getResend, isHoneypotTripped, isValidEmail } from '../email.js';

/**
 * Virtual coffee lead-capture: notify owner + confirm visitor.
 */
export async function handleVirtualCoffee(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ip = getClientIp(req);
  const limit = RATE_LIMITS['virtual-coffee'];
  const rl = checkRateLimit('virtual-coffee', ip, limit);
  applyRateLimitHeaders(res, rl, limit.max);
  if (!rl.ok) {
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return;
  }

  const body = readBody<Record<string, unknown>>(req);

  if (isHoneypotTripped(body)) {
    res.status(200).json({ success: true });
    return;
  }

  const safeName = clamp(body.name, 120);
  const safeEmail = clamp(body.email, 200);
  const safeRole = clamp(body.role, 200);
  const safeMessage = clamp(body.message, 2000);

  if (!safeName) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }
  if (!isValidEmail(safeEmail)) {
    res.status(400).json({ error: 'Valid email is required' });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    logError('virtual-coffee', new Error('RESEND_API_KEY is not configured'));
    res.status(500).json({ error: 'Service temporarily unavailable.' });
    return;
  }

  const notifyTo = getNotifyEmail();
  const firstName = safeName.split(/\s+/)[0] || safeName;
  const now = new Date();
  const when = now.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  try {
    const resend = getResend();

    const notifyResult = await resend.emails.send({
      from: 'adityaai.dev <aiexpert@adityaai.dev>',
      to: notifyTo,
      replyTo: safeEmail,
      subject: `New lead: virtual coffee with ${safeName}`,
      html: notifyEmailHtml({
        name: safeName,
        email: safeEmail,
        role: safeRole,
        message: safeMessage,
        when,
        firstName,
      }),
    });

    if (notifyResult.error) {
      logError('virtual-coffee:notify', notifyResult.error);
      res.status(400).json({ error: 'Unable to send request. Please try again.' });
      return;
    }

    const confirmResult = await resend.emails.send({
      from: 'Aditya Gaurav <aiexpert@adityaai.dev>',
      to: safeEmail,
      subject: `Let's grab that virtual coffee, ${firstName}`,
      html: confirmEmailHtml(firstName),
    });

    if (confirmResult.error) {
      // Notification already sent — still treat as success for the visitor path.
      logError('virtual-coffee:confirm', confirmResult.error);
    }

    res.status(200).json({ success: true });
  } catch (error: unknown) {
    logError('virtual-coffee', error);
    res.status(500).json({ error: publicErrorMessage(error) });
  }
}

function notifyEmailHtml(opts: {
  name: string;
  email: string;
  role: string;
  message: string;
  when: string;
  firstName: string;
}): string {
  const { name, email, role, message, when, firstName } = opts;
  return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>New virtual coffee lead</title>
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
                          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #CAFF4A;">adityaai.dev / new lead</span>
                        </div>
                        <h1 style="color: #fafafa; font-size: 24px; font-weight: 600; margin-top: 0; margin-bottom: 12px; text-align: center;">New virtual coffee request</h1>
                        <p style="color: #a1a1aa; font-size: 14px; line-height: 22px; margin: 0 0 32px 0; text-align: center;">
                          Someone just introduced themselves on your site. Details below.
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border: 1px solid #27272a; border-radius: 16px; background-color: #0a0a0a; margin-bottom: 24px;">
                          <tr>
                            <td style="padding: 24px;">
                              <div style="color: #52525b; font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px;">Visitor</div>
                              <div style="color: #fafafa; font-size: 22px; font-weight: 600; line-height: 1.25; margin-bottom: 4px;">${esc(name)}</div>
                              <div style="margin-bottom: 16px;">
                                <a href="mailto:${esc(email)}" style="color: #CAFF4A; text-decoration: none; font-size: 15px;">${esc(email)}</a>
                              </div>
                              ${
                                role
                                  ? `
                              <div style="display: inline-block; border: 1px solid #27272a; background-color: #09090b; color: #d4d4d8; font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 6px 12px; border-radius: 9999px; margin-bottom: 4px;">${esc(role)}</div>
                              `
                                  : ''
                              }
                            </td>
                          </tr>
                        </table>
                        ${
                          message
                            ? `
                        <div style="border-left: 2px solid #CAFF4A; padding: 4px 0 4px 20px; margin: 0 0 32px 0;">
                          <div style="color: #52525b; font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px;">What they'd like to chat about</div>
                          <p style="color: #e4e4e7; font-size: 15px; line-height: 24px; margin: 0; white-space: pre-wrap;">${esc(message)}</p>
                        </div>
                        `
                            : `
                        <div style="border-left: 2px solid #27272a; padding: 4px 0 4px 20px; margin: 0 0 32px 0;">
                          <p style="color: #71717a; font-size: 14px; line-height: 22px; margin: 0;">
                            They didn't leave a message. Might be worth a warm hello and a question about what they're working on.
                          </p>
                        </div>
                        `
                        }
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top: 1px solid #27272a; padding-top: 24px; margin-bottom: 24px;">
                          <tr>
                            <td style="padding-top: 24px;">
                              <div style="color: #52525b; font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 6px;">Received</div>
                              <div style="color: #d4d4d8; font-size: 14px;">${esc(when)}</div>
                            </td>
                          </tr>
                        </table>
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 16px; margin-bottom: 8px;">
                          <tr>
                            <td align="center">
                              <a href="mailto:${esc(email)}?subject=Re%3A%20Virtual%20coffee" style="background-color: #CAFF4A; color: #09090b; font-family: 'JetBrains Mono', monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; padding: 14px 28px; border-radius: 9999px; display: inline-block; font-weight: 600;">Reply to ${esc(firstName)}</a>
                            </td>
                          </tr>
                        </table>
                        <p style="color: #71717a; font-size: 12px; text-align: center; margin: 16px 0 0 0; font-family: 'JetBrains Mono', monospace;">
                          Or just hit reply on this email - it routes to ${esc(email)} automatically.
                        </p>
                        <div style="border-top: 1px solid #27272a; padding-top: 24px; margin-top: 32px;">
                          <p style="color: #52525b; font-size: 11px; margin: 0; font-family: 'JetBrains Mono', monospace; text-align: center; text-transform: uppercase; letter-spacing: 0.1em;">
                            adityaai.dev &nbsp;·&nbsp; virtual coffee pipeline
                          </p>
                        </div>
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

function confirmEmailHtml(firstName: string): string {
  return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Looking forward to our virtual coffee</title>
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
                          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #CAFF4A;">adityaai.dev / virtual coffee</span>
                        </div>
                        <h1 style="color: #fafafa; font-size: 24px; font-weight: 600; margin-top: 0; margin-bottom: 24px; text-align: center;">Got it, ${esc(firstName)}. Coffee is brewing.</h1>
                        <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;">
                          Thanks for reaching out. I read every virtual coffee request personally and will reply within 48 hours.
                        </p>
                        <p style="color: #a1a1aa; font-size: 16px; line-height: 24px; margin-top: 0; margin-bottom: 24px;">
                          While you wait, here are a few pieces that usually land with the folks who reach out:
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 32px;">
                          <tr>
                            <td style="padding: 8px 0;">
                              <a href="https://www.adityaai.dev/articles/memory-stacks-for-agents" style="color: #CAFF4A; text-decoration: none; font-size: 15px;">Memory Stacks for Agents <span style="color: #52525b;">- episodic, semantic, procedural</span></a>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <a href="https://www.adityaai.dev/articles/product-is-the-model" style="color: #CAFF4A; text-decoration: none; font-size: 15px;">The Product Is the Model</a>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <a href="https://www.adityaai.dev/articles/inference-economics-for-agents" style="color: #CAFF4A; text-decoration: none; font-size: 15px;">Inference Economics for Agents</a>
                            </td>
                          </tr>
                        </table>
                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top: 8px; margin-bottom: 32px;">
                          <tr>
                            <td align="center">
                              <a href="https://www.adityaai.dev" style="background-color: transparent; border: 1px solid #27272a; color: #a1a1aa; font-family: 'JetBrains Mono', monospace; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; text-decoration: none; padding: 14px 28px; border-radius: 9999px; display: inline-block;">Browse the lab</a>
                            </td>
                          </tr>
                        </table>
                        <div style="border-top: 1px solid #27272a; padding-top: 32px; margin-top: 32px;">
                          <p style="color: #71717a; font-size: 14px; margin: 0; font-family: 'JetBrains Mono', monospace;">
                            Talk soon,<br/><br/>
                            <strong style="color: #fafafa; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">Aditya Gaurav</strong><br/>
                            AI Researcher &amp; Systems Architect
                          </p>
                        </div>
                      </td>
                    </tr>
                  </table>
                  <p style="color: #52525b; font-size: 12px; text-align: center; margin-top: 24px; font-family: 'JetBrains Mono', monospace;">
                    If you didn't submit a virtual coffee request, you can safely ignore this email.
                  </p>
                </td>
              </tr>
            </table>
          </body>
        </html>
      `;
}
