/**
 * Minimal request/response shapes shared by Express and Vercel Node handlers.
 */

export type ApiRequest = {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
  ip?: string;
  /** Express / some runtimes expose parsed query; otherwise parse from url. */
  query?: Record<string, unknown>;
  url?: string;
};

export type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
  setHeader?: (name: string, value: string) => void;
  redirect?: (status: number, url: string) => void;
  end?: (body?: string) => void;
  statusCode?: number;
};

function firstForwardedIp(header: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(header) ? header[0] : header;
  if (typeof raw !== 'string') return undefined;
  return raw
    .split(',')
    .map((s) => s.trim())
    .find(Boolean);
}

export function getClientIp(req: ApiRequest): string {
  const vercelIp = firstForwardedIp(req.headers['x-vercel-forwarded-for']);
  if (vercelIp) return vercelIp;

  const realIp = firstForwardedIp(req.headers['x-real-ip']);
  if (realIp) return realIp;

  const forwardedIp = firstForwardedIp(req.headers['x-forwarded-for']);
  if (forwardedIp) return forwardedIp;

  if (typeof req.ip === 'string' && req.ip) return req.ip;
  return req.socket?.remoteAddress || 'unknown';
}

export function readBody<T extends Record<string, unknown>>(req: ApiRequest): T {
  if (req.body && typeof req.body === 'object') {
    return req.body as T;
  }
  if (typeof req.body === 'string' && req.body.trim().length > 0) {
    try {
      const parsed = JSON.parse(req.body);
      if (parsed && typeof parsed === 'object') {
        return parsed as T;
      }
    } catch {
      return {} as T;
    }
  }
  return {} as T;
}
