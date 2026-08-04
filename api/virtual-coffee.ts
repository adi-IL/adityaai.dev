import { handleVirtualCoffee } from '../lib/handlers/virtual-coffee.js';

export default async function handler(req: any, res: any) {
  await handleVirtualCoffee(req, res);
}
