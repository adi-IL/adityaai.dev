import type { ApiRequest, ApiResponse } from '../lib/http.js';
import { handleFeedback } from '../lib/handlers/feedback.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  await handleFeedback(req, res);
}
