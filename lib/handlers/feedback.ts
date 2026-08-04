import type { ApiRequest, ApiResponse } from '../http.js';
import { getClientIp, readBody } from '../http.js';
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS } from '../rate-limit.js';
import { logError, publicErrorMessage } from '../errors.js';
import { clamp, esc, getNotifyEmail, getResend, isHoneypotTripped, isValidEmail } from '../email.js';

const ALLOWED_REACTIONS = ['insightful', 'useful', 'needs-depth'] as const;

export async function handleFeedback(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ip = getClientIp(req);
  const limit = RATE_LIMITS.feedback;
  const rl = checkRateLimit('feedback', ip, limit);
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

  const slug = clamp(body.slug, 200);
  const reaction = clamp(body.reaction, 50);
  if (!slug || !reaction) {
    res.status(400).json({ error: 'Article slug and reaction are required' });
    return;
  }
  if (!(ALLOWED_REACTIONS as readonly string[]).includes(reaction)) {
    res.status(400).json({ error: `Invalid reaction. Allowed: ${ALLOWED_REACTIONS.join(', ')}` });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    logError('feedback', new Error('RESEND_API_KEY is not configured'));
    res.status(500).json({ error: 'Service temporarily unavailable.' });
    return;
  }

  const safeTitle = clamp(body.title, 200) || slug;
  const safeComment = clamp(body.comment, 2000);
  const safeEmail = clamp(body.email, 200);
  if (safeEmail && !isValidEmail(safeEmail)) {
    res.status(400).json({ error: 'Valid email is required' });
    return;
  }

  const notifyTo = getNotifyEmail();
  const reactionEmoji: Record<string, string> = {
    insightful: '🔥',
    useful: '💡',
    'needs-depth': '🤔',
  };
  const emoji = reactionEmoji[reaction] || '💬';

  try {
    const resend = getResend();
    await resend.emails.send({
      from: 'adityaai.dev <aiexpert@adityaai.dev>',
      to: notifyTo,
      ...(safeEmail && { replyTo: safeEmail }),
      subject: `${emoji} Article feedback: ${safeTitle}`,
      html: feedbackEmailHtml({
        emoji,
        reaction,
        slug,
        title: safeTitle,
        comment: safeComment,
        email: safeEmail,
      }),
    });

    res.status(200).json({ success: true });
  } catch (error: unknown) {
    logError('feedback', error);
    res.status(500).json({ error: publicErrorMessage(error) });
  }
}

function feedbackEmailHtml(opts: {
  emoji: string;
  reaction: string;
  slug: string;
  title: string;
  comment: string;
  email: string;
}): string {
  const { emoji, reaction, slug, title, comment, email } = opts;
  return `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
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
                          <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #CAFF4A;">adityaai.dev / article feedback</span>
                        </div>

                        <h1 style="color: #fafafa; font-size: 24px; font-weight: 600; margin-top: 0; margin-bottom: 12px; text-align: center;">
                          ${emoji} Reader says: ${esc(reaction.replace('-', ' '))}
                        </h1>

                        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border: 1px solid #27272a; border-radius: 16px; background-color: #0a0a0a; margin: 24px 0;">
                          <tr>
                            <td style="padding: 24px;">
                              <div style="color: #52525b; font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px;">Article</div>
                              <a href="https://www.adityaai.dev/articles/${esc(slug)}" style="color: #CAFF4A; text-decoration: none; font-size: 16px; font-weight: 500;">${esc(title)}</a>
                            </td>
                          </tr>
                        </table>

                        ${
                          comment
                            ? `
                        <div style="border-left: 2px solid #CAFF4A; padding: 4px 0 4px 20px; margin: 0 0 24px 0;">
                          <div style="color: #52525b; font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 10px;">Their feedback</div>
                          <p style="color: #e4e4e7; font-size: 15px; line-height: 24px; margin: 0; white-space: pre-wrap;">${esc(comment)}</p>
                        </div>
                        `
                            : ''
                        }

                        ${
                          email
                            ? `
                        <div style="border-top: 1px solid #27272a; padding-top: 24px; margin-top: 16px;">
                          <div style="color: #52525b; font-family: 'JetBrains Mono', monospace; font-size: 10px; text-transform: uppercase; letter-spacing: 0.12em; margin-bottom: 8px;">Reply to</div>
                          <a href="mailto:${esc(email)}" style="color: #CAFF4A; text-decoration: none; font-size: 15px;">${esc(email)}</a>
                        </div>
                        `
                            : ''
                        }

                        <div style="border-top: 1px solid #27272a; padding-top: 24px; margin-top: 24px;">
                          <p style="color: #52525b; font-size: 11px; margin: 0; font-family: 'JetBrains Mono', monospace; text-align: center; text-transform: uppercase; letter-spacing: 0.1em;">
                            adityaai.dev &nbsp;·&nbsp; article feedback pipeline
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
