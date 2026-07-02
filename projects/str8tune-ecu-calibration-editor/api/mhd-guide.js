/**
 * Vercel serverless: GET /api/mhd-guide (plain text MHD guide).
 */
import 'dotenv/config';
import { getMhdGuideText } from '../chat-logic.mjs';

export default function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  try {
    const text = getMhdGuideText();
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.status(200).send(text || '');
  } catch (err) {
    console.error('[api/mhd-guide]', err);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res
      .status(500)
      .send(`MHD guide error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
}
