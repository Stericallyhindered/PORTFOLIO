import { readFileSync, readdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function readIfExists(p) {
  try {
    if (existsSync(p)) return readFileSync(p, 'utf8');
  } catch {
    /* ignore */
  }
  return '';
}

/** Prefer cwd (Vercel / monorepo) then module dir (local node). */
function getProjectRoot() {
  const cwd = process.cwd();
  try {
    if (existsSync(join(cwd, 'docs'))) return cwd;
    if (existsSync(join(__dirname, 'docs'))) return __dirname;
  } catch {
    /* ignore */
  }
  return __dirname;
}

function antilagFallbackPath(root) {
  return join(root, 'tunerpro overview', 'antilag notes.txt');
}

/** Full MHD guide text for GET /api/mhd-guide (dev + production). Never throws. */
export function getMhdGuideText() {
  const root = getProjectRoot();
  try {
    const dir = join(root, 'docs', 'mhd', 'chunks');
    if (!existsSync(dir)) {
      return (
        readIfExists(antilagFallbackPath(root)) ||
        readIfExists(antilagFallbackPath(__dirname)) ||
        ''
      );
    }
    let names;
    try {
      names = readdirSync(dir);
    } catch (e) {
      console.warn('[getMhdGuideText] readdirSync:', e);
      return readIfExists(antilagFallbackPath(root)) || '';
    }
    const files = names.filter((f) => f.endsWith('.md') || f.endsWith('.txt'));
    const parts = [];
    for (const f of files.sort()) {
      try {
        parts.push(readFileSync(join(dir, f), 'utf8'));
      } catch (e) {
        console.warn(`[getMhdGuideText] skip ${f}:`, e);
      }
    }
    return parts.join('\n\n---\n\n');
  } catch (e) {
    console.error('[getMhdGuideText]', e);
    return (
      readIfExists(antilagFallbackPath(root)) ||
      readIfExists(antilagFallbackPath(__dirname)) ||
      ''
    );
  }
}

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
export const DEFAULT_OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini';

/** OpenRouter optional attribution; set PUBLIC_SITE_URL on Vercel or any public origin. */
function getOpenRouterReferer() {
  if (process.env.PUBLIC_SITE_URL) return process.env.PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return '';
}

function loadMhdChunks() {
  try {
    const root = getProjectRoot();
    const dir = join(root, 'docs', 'mhd', 'chunks');
    if (!existsSync(dir)) return '';
    let names;
    try {
      names = readdirSync(dir);
    } catch (e) {
      console.warn('[loadMhdChunks] readdirSync:', e);
      return '';
    }
    const files = names.filter((f) => f.endsWith('.md') || f.endsWith('.txt'));
    const parts = [];
    for (const f of files.sort()) {
      try {
        parts.push(`## ${f}\n\n${readFileSync(join(dir, f), 'utf8')}`);
      } catch (e) {
        console.warn(`[loadMhdChunks] skip ${f}:`, e);
      }
    }
    return parts.join('\n\n---\n\n');
  } catch (e) {
    console.warn('[loadMhdChunks]', e);
    return '';
  }
}

function loadMhdFallback() {
  const root = getProjectRoot();
  return (
    readIfExists(join(root, 'tunerpro overview', 'antilag notes.txt')) ||
    readIfExists(join(__dirname, 'tunerpro overview', 'antilag notes.txt'))
  );
}

function scoreChunk(query, chunk) {
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  const text = chunk.toLowerCase();
  let s = 0;
  for (const w of words) {
    if (text.includes(w)) s += 1;
  }
  return s;
}

function selectMhdContext(userMessage, tableHint, maxChars = 12000) {
  const full = loadMhdChunks() || loadMhdFallback();
  if (!full.trim()) return '';
  if (full.length <= maxChars) return full;
  const paragraphs = full.split(/\n\n+/);
  const query = `${userMessage} ${tableHint || ''}`;
  const scored = paragraphs.map((p) => ({ p, s: scoreChunk(query, p) }));
  scored.sort((a, b) => b.s - a.s);
  let out = '';
  for (const { p } of scored) {
    if (out.length + p.length > maxChars) break;
    out += (out ? '\n\n' : '') + p;
  }
  if (!out.trim()) return full.slice(0, maxChars);
  return out;
}

const MHD_GUIDE_BASE_SYSTEM = `You answer questions about MHD (bootmod3 MHD) tuning using **only** the MHD tuning guide excerpt below.

**Rules:**
- Ground every answer in the excerpt. Paraphrase or quote relevant parts. If the excerpt does not cover the topic, say clearly that it is not in the bundled guide and do not invent details.
- **Do not** claim specific calibration values, map addresses, or cell numbers from the user's BIN — you have no access to their files.
- **Do not** tell the user to search the parameter tree, navigate menus, or "find" maps in CHEAPTOONER unless they explicitly ask how to use the app's UI.
- Prefer concise, practical guidance. For safety-sensitive topics, remind them to validate on the car and log appropriately.`;

/** System prompt for /api/chat: MHD guide retrieval only (no CAL/XDF/session). */
export function buildMhdGuideSystemPrompt(userMessage) {
  const mhd = selectMhdContext(typeof userMessage === 'string' ? userMessage : '', '');
  const parts = [MHD_GUIDE_BASE_SYSTEM];
  if (mhd) {
    parts.push('\n\n## MHD tuning guide (excerpt — sole knowledge source for this chat)\n\n' + mhd);
  } else {
    parts.push(
      '\n\n(No MHD guide chunks could be loaded from the server. Say the guide is unavailable and do not fabricate MHD content.)'
    );
  }
  return parts.join('');
}

export async function forwardOpenRouterChat(body) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return {
      status: 503,
      json: {
        error:
          'OPENROUTER_API_KEY is not set. Create a .env file in the project root (see .env.example).',
      },
    };
  }

  const { messages, model } = body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return { status: 400, json: { error: 'messages required' } };
  }

  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const userText = typeof lastUser?.content === 'string' ? lastUser.content : '';
  let system;
  try {
    system = buildMhdGuideSystemPrompt(userText);
  } catch (err) {
    return {
      status: 500,
      json: {
        error:
          err instanceof Error
            ? `System prompt failed: ${err.message}`
            : 'System prompt failed',
      },
    };
  }

  const payload = {
    model: model || DEFAULT_OPENROUTER_MODEL,
    messages: [{ role: 'system', content: system }, ...messages],
    max_tokens: 2048,
  };

  const headers = {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    'X-Title': 'CHEAPTOONER',
  };
  const referer = getOpenRouterReferer();
  if (referer) headers['HTTP-Referer'] = referer;

  let r;
  try {
    r = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      status: 502,
      json: {
        error:
          err instanceof Error
            ? `OpenRouter request failed: ${err.message}`
            : 'OpenRouter request failed (network)',
      },
    };
  }

  const text = await r.text();
  let data;
  if (!text.trim()) {
    return {
      status: r.ok ? 502 : r.status,
      json: {
        error: r.ok
          ? 'OpenRouter returned an empty body.'
          : `OpenRouter error ${r.status} with empty body.`,
      },
    };
  }
  try {
    data = JSON.parse(text);
  } catch {
    return {
      status: 502,
      json: {
        error: `Invalid JSON from OpenRouter (HTTP ${r.status}): ${text.slice(0, 280)}`,
      },
    };
  }

  if (!r.ok) {
    return { status: r.status, json: data };
  }
  return { status: 200, json: data };
}
