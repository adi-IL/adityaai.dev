import type { ApiRequest, ApiResponse } from '../lib/http.js';
import { handleC2hReport } from '../lib/handlers/c2h-report.js';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  await handleC2hReport(req, res);
}
