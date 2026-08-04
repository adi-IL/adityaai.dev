import { handleChat } from '../lib/handlers/chat.js';

export default async function handler(req: any, res: any) {
  await handleChat(req, res);
}
