import type { ApiRequest, ApiResponse } from '../../lib/http.js';
import { handleSubscribeConfirm } from '../../lib/handlers/subscribe.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  await handleSubscribeConfirm(req, res);
}
