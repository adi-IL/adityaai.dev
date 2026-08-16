import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Vertex / Gemini client - same auth pattern as sentinel-main:
 *  1) GEMINI_API_KEY / GOOGLE_API_KEY (Google AI Studio)
 *  2) else Vertex ADC via GCP_CREDENTIALS_JSON (or aliases) written to /tmp
 *  3) project + location from GCP_PROJECT_ID / GCP_LOCATION (with GOOGLE_* aliases)
 */

let client: GoogleGenAI | null = null;

function credentialsJsonFromEnv(): string | undefined {
  const raw =
    process.env.GCP_CREDENTIALS_JSON?.trim() ||
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim() ||
    process.env.GOOGLE_CREDENTIALS_JSON?.trim();
  return raw || undefined;
}

/**
 * Workaround for Vercel: write SA JSON from env to /tmp so ADC can load it.
 * Mirrors sentinel `api/_shared/gemini.ts`.
 */
function ensureGcpCredentialsFromEnv(): void {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Already pointed at a file (local ADC path or previous write)
    return;
  }
  const raw = credentialsJsonFromEnv();
  if (!raw) return;

  let json = raw;
  // Accept base64-encoded JSON as well
  if (!raw.startsWith('{')) {
    try {
      const decoded = Buffer.from(raw, 'base64').toString('utf8');
      if (decoded.trim().startsWith('{')) json = decoded;
    } catch {
      /* keep raw */
    }
  }

  const tmpPath = path.join('/tmp', 'gcp_adc.json');
  try {
    if (!fs.existsSync(tmpPath)) {
      fs.writeFileSync(tmpPath, json, { encoding: 'utf-8', mode: 0o600 });
    }
    process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
  } catch (err) {
    console.error('Failed to write GCP credentials to /tmp', err);
  }
}

export function getVertexProject(): string {
  return (
    process.env.GCP_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.VITE_GCP_PROJECT_ID ||
    process.env.GCP_PROJECT ||
    'project-dace7531-ac79-4f81-bd2'
  );
}

export function getVertexLocation(): string {
  return (
    process.env.GCP_LOCATION ||
    process.env.GOOGLE_CLOUD_LOCATION ||
    process.env.VERTEX_LOCATION ||
    'global'
  );
}

export function getChatModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-3.7-flash';
}

export function isSearchEnabled(): boolean {
  const v = (process.env.CHAT_ENABLE_SEARCH || 'true').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Same priority as Sentinel: API key first, then Vertex + env credentials.
 */
export function getGenAI(userKey?: string): GoogleGenAI {
  if (client && !userKey) return client;

  const apiKey =
    (userKey && userKey.trim()) ||
    process.env.GEMINI_API_KEY?.trim() ||
    process.env.GOOGLE_API_KEY?.trim();

  if (apiKey) {
    const c = new GoogleGenAI({ apiKey });
    if (!userKey) client = c;
    return c;
  }

  ensureGcpCredentialsFromEnv();

  const project = getVertexProject();
  if (!project) {
    throw new Error(
      'Set GCP_PROJECT_ID (or GOOGLE_CLOUD_PROJECT) for Vertex, or set GEMINI_API_KEY.',
    );
  }

  const c = new GoogleGenAI({
    vertexai: true,
    project,
    location: getVertexLocation(),
  });
  if (!userKey) client = c;
  return c;
}

export function extractText(response: {
  text?: string;
  candidates?: Array<{ content?: { parts?: Array<{ text?: string, functionCall?: { name: string, args: Record<string, unknown> } }> } }>;
}): string {
  if (typeof response.text === 'string' && response.text.trim()) {
    return response.text.trim();
  }
  const parts = response.candidates?.[0]?.content?.parts || [];
  return parts
    .map((p) => p.text || '')
    .join('')
    .trim();
}

export function extractFunctionCalls(response: {
  candidates?: Array<{ content?: { parts?: Array<{ functionCall?: { name: string, args: Record<string, unknown> } }> } }>;
}) {
  const parts = response.candidates?.[0]?.content?.parts || [];
  return parts
    .map((p) => p.functionCall)
    .filter(Boolean) as Array<{ name: string, args: Record<string, unknown> }>;
}

export type ChatSource = { title?: string; uri?: string };

export function extractSources(response: {
  candidates?: Array<{
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { title?: string; uri?: string; domain?: string } }>;
    };
  }>;
}): ChatSource[] {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const out: ChatSource[] = [];
  const seen = new Set<string>();
  for (const c of chunks) {
    const web = c.web;
    if (!web?.uri) continue;
    if (seen.has(web.uri)) continue;
    seen.add(web.uri);
    out.push({
      title: web.title || web.domain || 'Source',
      uri: web.uri,
    });
    if (out.length >= 6) break;
  }
  return out;
}
