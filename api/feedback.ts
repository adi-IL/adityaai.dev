import { handleFeedback } from '../lib/handlers/feedback.js';

export default async function handler(req: any, res: any) {
  await handleFeedback(req, res);
}
