import { handleSubscribe } from '../lib/handlers/subscribe.js';

export default async function handler(req: any, res: any) {
  await handleSubscribe(req, res);
}
