import type { ApiRequest, ApiResponse } from '../http.js';
import { getClientIp, readBody } from '../http.js';
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS } from '../rate-limit.js';
import { logError, publicErrorMessage } from '../errors.js';
import { clamp, esc, getNotifyEmail, getResend, isHoneypotTripped } from '../email.js';

/**
 * c2-h support-setup report: emails the owner connection details for a
 * freshly configured machine. Called by the public c2-h.ps1 setup script.
 *
 * Recipient and subject shape are fixed server-side; the client only
 * supplies clamped machine details. Unauthenticated by design (no secret
 * can live in a public script) — contained with a tight per-IP rate limit
 * and a tiny fixed-schema payload.
 */
export async function handleC2hReport(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ip = getClientIp(req);
  const limit = RATE_LIMITS['c2h-report'];
  const rl = checkRateLimit('c2h-report', ip, limit);
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

  const hostname = oneLine(clamp(body.hostname, 64));
  const supportUser = oneLine(clamp(body.supportUser, 64));
  const password = oneLine(clamp(body.password, 128));
  const mainUser = oneLine(clamp(body.mainUser, 64));
  const internalIps = oneLine(clamp(body.internalIps, 256));
  const externalIp = oneLine(clamp(body.externalIp, 64));
  const upnp = clamp(body.upnp, 256);
  const version = oneLine(clamp(body.version, 32));
  const reportedAt = oneLine(clamp(body.reportedAt, 64));
  const rawInternalPort =
    typeof body.internalPort === 'number' ? body.internalPort : parseInt(String(body.internalPort ?? ''), 10);
  const internalPort =
    Number.isFinite(rawInternalPort) && rawInternalPort >= 1 && rawInternalPort <= 65535
      ? Math.floor(rawInternalPort)
      : 22;
  const rawExternalPort =
    typeof body.externalPort === 'number' ? body.externalPort : parseInt(String(body.externalPort ?? ''), 10);
  const externalPort =
    Number.isFinite(rawExternalPort) && rawExternalPort >= 1 && rawExternalPort <= 65535
      ? Math.floor(rawExternalPort)
      : 2222;
  const cgnat = body.cgnat === true || body.cgnat === 'true' || body.cgnat === '1';

  if (!hostname || !supportUser || !password || !externalIp) {
    res.status(400).json({ error: 'Machine details are incomplete' });
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    logError('c2h-report', new Error('RESEND_API_KEY is not configured'));
    res.status(500).json({ error: 'Service temporarily unavailable.' });
    return;
  }

  const notifyTo = getNotifyEmail();
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

  const fields = {
    hostname,
    supportUser,
    password,
    mainUser: mainUser || '—',
    internalIps: internalIps || 'NOT-FOUND',
    externalIp,
    internalPort,
    externalPort,
    cgnat,
    upnp: upnp || '—',
    version: version || '—',
    reportedAt: reportedAt || when,
  };

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: 'adityaai.dev <aiexpert@adityaai.dev>',
      to: notifyTo,
      subject: `Support setup ready: ${hostname}`,
      html: reportEmailHtml({ ...fields, when }),
      text: reportEmailText({ ...fields, when }),
    });

    if (result.error) {
      logError('c2h-report', result.error);
      res.status(400).json({ error: 'Unable to send report. Please try again.' });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error: unknown) {
    logError('c2h-report', error);
    res.status(500).json({ error: publicErrorMessage(error) });
  }
}

/** Strip CR/LF everywhere a value can reach the mail subject line. */
function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

type ReportFields = {
  hostname: string;
  supportUser: string;
  password: string;
  mainUser: string;
  internalIps: string;
  externalIp: string;
  internalPort: number;
  externalPort: number;
  cgnat: boolean;
  upnp: string;
  version: string;
  reportedAt: string;
  when: string;
};

function reportEmailHtml(f: ReportFields): string {
  const badge = f.cgnat
    ? `<span style="display:inline-block;background:#451a03;color:#fbbf24;border:1px solid #92400e;border-radius:9999px;padding:2px 12px;font-size:12px;">CGNAT — port-forward will NOT work, use Tailscale</span>`
    : `<span style="display:inline-block;background:#052e16;color:#4ade80;border:1px solid #166534;border-radius:9999px;padding:2px 12px;font-size:12px;">Public IP — port-forward should work</span>`;
  return `<!doctype html>
<html><body style="margin:0;padding:0;background:#09090b;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:32px 20px;">
<div style="font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;color:#71717a;">adityaai.dev · support</div>
<h1 style="color:#fafafa;font-size:24px;margin:8px 0 4px;">Setup report is ready 🎉</h1>
<p style="color:#a1a1aa;font-size:14px;margin:0 0 24px;">${esc(f.hostname)} finished the one-time setup · ${esc(f.when)}${f.version !== '—' ? ` · ${esc(f.version)}` : ''}</p>
<div style="background:#131316;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
<div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#71717a;margin-bottom:12px;">Login credentials</div>
<div style="color:#a1a1aa;font-size:13px;">Computer</div>
<div style="color:#fafafa;font-size:15px;margin-bottom:10px;font-family:'JetBrains Mono',monospace;">${esc(f.hostname)}</div>
<div style="color:#a1a1aa;font-size:13px;">Username</div>
<div style="color:#fafafa;font-size:15px;margin-bottom:10px;font-family:'JetBrains Mono',monospace;">${esc(f.supportUser)}</div>
<div style="color:#a1a1aa;font-size:13px;">Password</div>
<div style="background:#052e16;border:1px solid #166534;border-radius:8px;color:#4ade80;font-family:'JetBrains Mono',monospace;font-size:18px;letter-spacing:0.08em;padding:10px 14px;margin-top:4px;">${esc(f.password)}</div>
<div style="color:#71717a;font-size:12px;margin-top:10px;">Their main Windows user is ${esc(f.mainUser)} (password untouched, separate login).</div>
</div>
<div style="background:#131316;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
<div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#71717a;margin-bottom:12px;">Connect from Linux</div>
<div style="background:#000;border:1px solid #27272a;border-radius:8px;color:#e4e4e7;font-family:'JetBrains Mono',monospace;font-size:13px;padding:10px 14px;margin-bottom:8px;">ssh ${esc(f.supportUser)}@${esc(f.externalIp)} -p ${f.externalPort}</div>
<div style="color:#71717a;font-size:12px;margin-bottom:8px;">Same-WiFi test (no router needed):</div>
<div style="background:#000;border:1px solid #27272a;border-radius:8px;color:#e4e4e7;font-family:'JetBrains Mono',monospace;font-size:13px;padding:10px 14px;">ssh ${esc(f.supportUser)}@${esc(f.internalIps)}</div>
</div>
<div style="background:#131316;border:1px solid #27272a;border-radius:12px;padding:20px;margin-bottom:16px;">
<div style="font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:#71717a;margin-bottom:12px;">Network</div>
<div style="margin-bottom:10px;">${badge}</div>
<table style="width:100%;border-collapse:collapse;font-size:13px;">
<tr><td style="color:#71717a;padding:3px 0;">Internal IP</td><td style="color:#fafafa;text-align:right;font-family:'JetBrains Mono',monospace;">${esc(f.internalIps)}</td></tr>
<tr><td style="color:#71717a;padding:3px 0;">External IP</td><td style="color:#fafafa;text-align:right;font-family:'JetBrains Mono',monospace;">${esc(f.externalIp)}</td></tr>
<tr><td style="color:#71717a;padding:3px 0;">Ports</td><td style="color:#fafafa;text-align:right;font-family:'JetBrains Mono',monospace;">ext ${f.externalPort} → ${f.internalPort}</td></tr>
<tr><td style="color:#71717a;padding:3px 0;">UPnP</td><td style="color:#fafafa;text-align:right;">${esc(f.upnp)}</td></tr>
</table>
</div>
<p style="color:#71717a;font-size:12px;line-height:1.6;">Temporary credential — delete when support is done (<span style="font-family:'JetBrains Mono',monospace;">net user ${esc(f.supportUser)} /delete</span> as Admin + remove router rule). Reported ${esc(f.reportedAt)}.</p>
</div>
</body></html>`;
}

function reportEmailText(f: ReportFields): string {
  return [
    `Support setup ready: ${f.hostname} (${f.when})`,
    ``,
    `Computer:  ${f.hostname}`,
    `Username:  ${f.supportUser}`,
    `Password:  ${f.password}`,
    `Main user: ${f.mainUser} (password untouched)`,
    ``,
    `Connect:   ssh ${f.supportUser}@${f.externalIp} -p ${f.externalPort}`,
    `Same WiFi: ssh ${f.supportUser}@${f.internalIps}`,
    ``,
    `Internal IP: ${f.internalIps}`,
    `External IP: ${f.externalIp} ${f.cgnat ? '(CGNAT — forward will NOT work)' : '(public-looking)'}`,
    `Ports: ext ${f.externalPort} -> ${f.internalPort}`,
    `UPnP: ${f.upnp}`,
    ``,
    `Temporary credential — delete when done: net user ${f.supportUser} /delete.`,
  ].join('\n');
}
