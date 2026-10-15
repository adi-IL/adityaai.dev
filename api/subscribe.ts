import type { ApiRequest, ApiResponse } from '../lib/http.js';
import { handleSubscribe } from '../lib/handlers/subscribe.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  await handleSubscribe(req, res);
}
