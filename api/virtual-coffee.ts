import type { ApiRequest, ApiResponse } from '../lib/http.js';
import { handleVirtualCoffee } from '../lib/handlers/virtual-coffee.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  await handleVirtualCoffee(req, res);
}
