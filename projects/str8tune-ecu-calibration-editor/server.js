import 'dotenv/config';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { forwardOpenRouterChat, getMhdGuideText } from './chat-logic.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));

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
    console.error('[server] /api/chat', err);
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Chat handler failed',
    });
  }
});

app.get('/api/mhd-guide', (_req, res) => {
  try {
    const text = getMhdGuideText();
    res.type('text/plain; charset=utf-8').send(text || '');
  } catch (err) {
    console.error('[server] /api/mhd-guide', err);
    res
      .status(500)
      .type('text/plain; charset=utf-8')
      .send(`MHD guide error: ${err instanceof Error ? err.message : 'unknown'}`);
  }
});

app.use(express.static(join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
