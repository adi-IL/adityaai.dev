import { GoogleGenAI } from '@google/genai';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

let client: GoogleGenAI | null = null;
let credentialsPath: string | null = null;

/**
 * Ensure ADC-compatible credentials file when GOOGLE_SERVICE_ACCOUNT_JSON
 * is provided (Vercel / CI). Local gcloud ADC is used otherwise.
 */
function ensureServiceAccountCredentials(): void {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) return;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return;

  if (!credentialsPath) {
    const file = path.join(os.tmpdir(), `adityaai-gcp-sa-${process.pid}.json`);
    // Accept raw JSON or base64
    let json = raw;
    if (!raw.startsWith('{')) {
      try {
        json = Buffer.from(raw, 'base64').toString('utf8');
      } catch {
        /* keep raw */
      }
    }
    fs.writeFileSync(file, json, { mode: 0o600 });
    credentialsPath = file;
  }
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credentialsPath;
}

export function getVertexProject(): string {
  return (
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT ||
    process.env.GCP_PROJECT ||
    ''
  );
}

export function getVertexLocation(): string {
  return process.env.GOOGLE_CLOUD_LOCATION || process.env.VERTEX_LOCATION || 'us-central1';
}

export function getChatModel(): string {
  return process.env.GEMINI_MODEL || 'gemini-2.5-flash';
}

export function isSearchEnabled(): boolean {
  const v = (process.env.CHAT_ENABLE_SEARCH || 'true').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export function getGenAI(): GoogleGenAI {
  if (client) return client;

  ensureServiceAccountCredentials();
  const project = getVertexProject();
  if (!project) {
    throw new Error(
      'GOOGLE_CLOUD_PROJECT is not set. Set it to your GCP project id (Vertex AI).',
    );
  }

  client = new GoogleGenAI({
    vertexai: true,
    project,
    location: getVertexLocation(),
  });
  return client;
}

export function extractText(response: {
  text?: string;
  candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
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
