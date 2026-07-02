/**
 * Vercel serverless: POST /api/chat (OpenRouter proxy).
 * Local dev uses chat-api.mjs + Vite proxy instead.
 */
import 'dotenv/config';
import { forwardOpenRouterChat } from '../chat-logic.mjs';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const result = await forwardOpenRouterChat(req.body);
    const body =
      result.json !== undefined && result.json !== null
        ? result.json
        : { error: 'Chat handler returned an empty payload' };
    const status = Number.isFinite(result.status) ? result.status : 500;
    res.status(status).json(body);
  } catch (err) {
    console.error('[api/chat]', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Chat handler failed',
    });
  }
}
