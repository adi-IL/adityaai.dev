import type { ApiRequest, ApiResponse } from '../lib/http.js';
import { handleChat } from '../lib/handlers/chat.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  await handleChat(req, res);
}
