import type { ApiRequest, ApiResponse } from '../http.js';
import { getClientIp, readBody } from '../http.js';
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS } from '../rate-limit.js';
import { logError } from '../errors.js';
import {
  extractSources,
  extractText,
  getChatModel,
  getGenAI,
  isSearchEnabled,
  type ChatSource,
} from '../vertex.js';
import { buildSystemInstruction } from '../site-context.js';

const MAX_MESSAGES = 12;
const MAX_CONTENT_CHARS = 2000;

type ChatRole = 'user' | 'assistant';
type ChatMessage = { role: ChatRole; content: string };

function normalizeMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: ChatMessage[] = [];
  for (const item of raw.slice(-MAX_MESSAGES)) {
    if (!item || typeof item !== 'object') continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== 'user' && role !== 'assistant') continue;
    if (typeof content !== 'string') continue;
    const trimmed = content.trim().slice(0, MAX_CONTENT_CHARS);
    if (!trimmed) continue;
    out.push({ role, content: trimmed });
  }
  if (out.length === 0) return null;
  // Last message must be from the user
  if (out[out.length - 1]?.role !== 'user') return null;
  return out;
}

function toGeminiContents(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

export async function handleChat(req: ApiRequest, res: ApiResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const ip = getClientIp(req);
  const limit = RATE_LIMITS.chat;
  const rl = checkRateLimit('chat', ip, limit);
  applyRateLimitHeaders(res, rl, limit.max);
  if (!rl.ok) {
    res.status(429).json({ error: 'Too many chat requests. Please try again later.' });
    return;
  }

  const body = readBody<Record<string, unknown>>(req);
  // Honeypot
  if (typeof body.website === 'string' && body.website.trim()) {
    res.status(200).json({ reply: 'Thanks for visiting the lab.' });
    return;
  }

  const messages = normalizeMessages(body.messages);
  if (!messages) {
    res.status(400).json({ error: 'Send a non-empty messages array ending with a user turn.' });
    return;
  }

  const forceSearch = body.forceSearch === true;
  const searchEnabled = isSearchEnabled();
  const useSearch = searchEnabled && (forceSearch || shouldLikelyNeedSearch(messages));

  try {
    const ai = getGenAI();
    const model = getChatModel();
    const result = await ai.models.generateContent({
      model,
      contents: toGeminiContents(messages),
      config: {
        systemInstruction: buildSystemInstruction(searchEnabled),
        temperature: 0.4,
        maxOutputTokens: 1024,
        ...(useSearch ? { tools: [{ googleSearch: {} }] } : {}),
      },
    });

    const reply = extractText(result);
    if (!reply) {
      logError('chat:empty', result);
      res.status(502).json({ error: 'The lab guide had nothing to say. Try again.' });
      return;
    }

    const sources: ChatSource[] = useSearch ? extractSources(result) : [];
    res.status(200).json({
      reply,
      ...(sources.length ? { sources } : {}),
      usedSearch: useSearch,
    });
  } catch (error: unknown) {
    logError('chat', error);
    res.status(500).json({ error: 'Lab guide is temporarily unavailable. Please try again.' });
  }
}

/**
 * Heuristic: use Search when the last user message looks like external/news
 * research rather than a site-local question.
 */
function shouldLikelyNeedSearch(messages: ChatMessage[]): boolean {
  const last = messages[messages.length - 1]?.content.toLowerCase() || '';
  if (
    /(essay|article|shelf|aditya|friday|sentinel|opalserve|memory stack|inference economic|mcp security|software 3|virtual coffee|newsletter|project)/i.test(
      last,
    )
  ) {
    return false;
  }
  return /(latest|news|today|202[5-9]|who is|what happened|benchmark score|price of|current|search|web|internet)/i.test(
    last,
  );
}
