/**
 * Dev API server for OpenRouter chat + MHD guide text.
 */
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { forwardOpenRouterChat, getMhdGuideText } from './chat-logic.mjs';

const PORT = Number(process.env.CHAT_API_PORT || 3001);

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '2mb' }));

app.get('/api/mhd-guide', (_req, res) => {
  try {
    const text = getMhdGuideText();
    res.type('text/plain; charset=utf-8').send(text || 'MHD guide not found.');
  } catch (err) {
    console.error('[chat-api] /api/mhd-guide', err);
    res
      .status(500)
      .type('text/plain; charset=utf-8')
      .send(`MHD guide error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const result = await forwardOpenRouterChat(req.body);
    const body =
      result.json !== undefined && result.json !== null
        ? result.json
        : { error: 'Chat handler returned an empty payload' };
    const status = Number.isFinite(result.status) ? result.status : 500;
    res.status(status).json(body);
  } catch (err) {
    console.error('[chat-api] /api/chat', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Chat handler failed',
    });
  }
});

app.listen(PORT, () => {
  console.log(`[chat-api] listening on port ${PORT}`);
});
