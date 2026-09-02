import type { ApiRequest, ApiResponse } from '../http.js';
import { getClientIp, readBody } from '../http.js';
import { applyRateLimitHeaders, checkRateLimit, RATE_LIMITS } from '../rate-limit.js';
import { logError } from '../errors.js';
import {
  extractSources,
  extractText,
  extractFunctionCalls,
  getChatModel,
  getGenAI,
  isSearchEnabled,
  type ChatSource,
} from '../vertex.js';
import { buildSystemInstruction } from '../site-context.js';
import { Type } from '@google/genai';

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

async function generateWithRetry(
  ai: ReturnType<typeof getGenAI>,
  params: Parameters<typeof ai.models.generateContent>[0],
  maxRetries = 2,
) {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      return await ai.models.generateContent(params);
    } catch (err: any) {
      attempt++;
      const is429 =
        err?.status === 429 ||
        err?.code === 429 ||
        (typeof err?.message === 'string' &&
          (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED')));
      if (is429 && attempt <= maxRetries) {
        logError(`chat:429_retry_${attempt}`, err);
        await new Promise((resolve) => setTimeout(resolve, attempt * 1200));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
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
    let result;
    let actualUseSearch = useSearch;

    try {
      result = await generateWithRetry(ai, {
        model,
        contents: toGeminiContents(messages),
        config: {
          systemInstruction: buildSystemInstruction(searchEnabled),
          temperature: 0.4,
          maxOutputTokens: 1024,
          tools: [
            ...(useSearch ? [{ googleSearch: {} }] : []),
            {
              functionDeclarations: [
                {
                  name: 'navigateTo',
                  description: 'Navigates the user to a different page on the site. Use this when the user asks to see a project, essay, or the about page.',
                  parameters: {
                    type: Type.OBJECT,
                    properties: {
                      path: {
                        type: Type.STRING,
                        description: 'The relative path to navigate to (e.g. /projects, /about, /articles/memory-stacks-for-agents)',
                      },
                    } as any,
                    required: ['path'],
                  } as any,
                } as any,
              ],
            } as any,
          ],
        },
      });
    } catch (searchError: unknown) {
      if (useSearch) {
        logError('chat:search_fallback', searchError);
        actualUseSearch = false;
        result = await generateWithRetry(ai, {
          model,
          contents: toGeminiContents(messages),
          config: {
            systemInstruction: buildSystemInstruction(searchEnabled),
            temperature: 0.4,
            maxOutputTokens: 1024,
            tools: [
              {
                functionDeclarations: [
                  {
                    name: 'navigateTo',
                    description: 'Navigates the user to a different page on the site. Use this when the user asks to see a project, essay, or the about page.',
                    parameters: {
                      type: Type.OBJECT,
                      properties: {
                        path: {
                          type: Type.STRING,
                          description: 'The relative path to navigate to (e.g. /projects, /about, /articles/memory-stacks-for-agents)',
                        },
                      } as any,
                      required: ['path'],
                    } as any,
                  } as any,
                ],
              },
            ],
          },
        });
      } else {
        throw searchError;
      }
    }

    let reply = extractText(result as any);
    const functionCalls = extractFunctionCalls(result as any);
    
    // Auto-generate a reply if the model only returned a function call without text
    if (!reply && functionCalls.length > 0) {
      const call = functionCalls[0];
      if (call.name === 'navigateTo' && call.args?.path) {
        reply = `Navigating to ${call.args.path}...`;
      }
    }

    if (!reply) {
      logError('chat:empty', result);
      res.status(502).json({ error: 'The lab guide had nothing to say. Try again.' });
      return;
    }

    const sources: ChatSource[] = actualUseSearch ? extractSources(result as any) : [];
    res.status(200).json({
      reply,
      model,
      functionCalls,
      ...(sources.length ? { sources } : {}),
      usedSearch: actualUseSearch,
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
    /(essay|article|shelf|aditya|friday|sentinel|midsphere|memory stack|inference economic|mcp security|software 3|virtual coffee|newsletter|project)/i.test(
      last,
    )
  ) {
    return false;
  }
  return /(latest|news|today|202[5-9]|who is|what happened|benchmark score|price of|current|search|web|internet)/i.test(
    last,
  );
}
