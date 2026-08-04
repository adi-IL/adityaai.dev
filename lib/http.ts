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

export function getClientIp(req: ApiRequest): string {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.length > 0) {
    return xf.split(',')[0]?.trim() || 'unknown';
  }
  if (Array.isArray(xf) && xf[0]) {
    return xf[0].split(',')[0]?.trim() || 'unknown';
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp.trim();
  if (typeof req.ip === 'string' && req.ip) return req.ip;
  return req.socket?.remoteAddress || 'unknown';
}

export function readBody<T extends Record<string, unknown>>(req: ApiRequest): T {
  return (req.body && typeof req.body === 'object' ? req.body : {}) as T;
}
