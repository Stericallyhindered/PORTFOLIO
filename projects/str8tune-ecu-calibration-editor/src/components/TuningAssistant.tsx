import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Minimize2, BookOpen } from 'lucide-react';
import { useStore } from '../store/useStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

type Tab = 'guide' | 'ask';

const WELCOME =
  "Ask a question about **MHD tuning** — answers use **only** the bundled MHD guide (retrieved by topic). This chat does **not** read your XDF, BIN, or map cells. Use the main editor for calibration data.";

export function TuningAssistant() {
  const assistantOpen = useStore((s) => s.assistantOpen);
  const setAssistantOpen = useStore((s) => s.setAssistantOpen);
  const [isMinimized, setIsMinimized] = useState(false);
  const [tab, setTab] = useState<Tab>('guide');
  const [guideText, setGuideText] = useState<string>('');
  const [guideError, setGuideError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: WELCOME },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!assistantOpen || tab !== 'guide') return;
    let cancelled = false;
    setGuideError(null);
    fetch('/api/mhd-guide')
      .then(async (r) => {
        const text = await r.text();
        if (!r.ok) {
          throw new Error(text.trim() || `${r.status} ${r.statusText}`);
        }
        return text;
      })
      .then((t) => {
        if (!cancelled) setGuideText(t || 'No MHD guide content.');
      })
      .catch((e) => {
        if (!cancelled) setGuideError(e instanceof Error ? e.message : 'Failed to load guide');
      });
    return () => {
      cancelled = true;
    };
  }, [assistantOpen, tab]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const conversationHistory = messages.slice(-10).map((msg) => ({
        role: msg.role === 'user' ? ('user' as const) : ('assistant' as const),
        content: msg.content,
      }));

      const model = import.meta.env.VITE_OPENROUTER_MODEL as string | undefined;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || undefined,
          messages: [
            ...conversationHistory,
            { role: 'user', content: userMessage },
          ],
        }),
      });

      const raw = await response.text();
      let data: Record<string, unknown> | null = null;
      if (raw.trim()) {
        try {
          data = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          throw new Error(
            `Server did not return JSON (${response.status}). ${raw.slice(0, 180)}${raw.length > 180 ? '…' : ''} — use npm run dev so Vite proxies to the chat API, or check the Network tab.`
          );
        }
      } else if (!response.ok) {
        throw new Error(
          `Empty response (${response.status}). Run npm run dev (starts Vite + chat API on port 3001), not npm run dev:vite alone.`
        );
      } else {
        throw new Error('Empty response from /api/chat.');
      }

      if (!response.ok) {
        const errObj = data?.error as { message?: string } | string | undefined;
        const err =
          (typeof errObj === 'object' && errObj?.message) ||
          (typeof errObj === 'string' ? errObj : null) ||
          (typeof data?.error === 'string' ? data.error : null) ||
          JSON.stringify(data);
        throw new Error(String(err || response.statusText));
      }

      const choices = data?.choices as Array<{ message?: { content?: string } }> | undefined;
      const assistantMessage =
        choices?.[0]?.message?.content ??
        (typeof data?.error === 'string' ? data.error : null) ??
        'No response text.';

      setMessages((prev) => [...prev, { role: 'assistant', content: assistantMessage }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!assistantOpen) {
    return (
      <button
        type="button"
        onClick={() => setAssistantOpen(true)}
        className="fixed bottom-5 right-4 sm:right-6 z-[200] flex items-center gap-2 rounded-full bg-dark-accent pl-4 pr-4 py-3 text-sm font-medium text-white shadow-lg ring-2 ring-white/15 hover:bg-dark-accentHover transition-colors"
        title="Open MHD guide"
      >
        <BookOpen className="h-5 w-5 shrink-0" />
        <span>MHD guide</span>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-5 right-4 sm:right-6 bg-dark-surface border border-dark-border rounded-lg shadow-xl z-[200] flex flex-col ${
        isMinimized ? 'w-80 h-12' : 'w-[min(100vw-2rem,28rem)] h-[min(100vh-6rem,36rem)]'
      } transition-all`}
    >
      <div className="flex items-center justify-between p-2 border-b border-dark-border gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <BookOpen className="w-4 h-4 text-dark-accent flex-shrink-0" />
          <span className="text-sm font-semibold truncate">MHD guide</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-dark-surface2 rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setAssistantOpen(false)}
            className="p-1 hover:bg-dark-surface2 rounded transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="flex border-b border-dark-border shrink-0">
            <button
              type="button"
              onClick={() => setTab('guide')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium ${
                tab === 'guide' ? 'bg-dark-accent/20 text-dark-text border-b-2 border-dark-accent' : 'text-dark-text2'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              MHD guide
            </button>
            <button
              type="button"
              onClick={() => setTab('ask')}
              className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium ${
                tab === 'ask' ? 'bg-dark-accent/20 text-dark-text border-b-2 border-dark-accent' : 'text-dark-text2'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Ask (MHD only)
            </button>
          </div>

          {tab === 'guide' ? (
            <div className="flex-1 overflow-y-auto p-3 text-xs text-dark-text min-h-0 scrollbar-thin whitespace-pre-wrap font-mono leading-relaxed">
              {guideError && (
                <p className="text-dark-error mb-2">{guideError}</p>
              )}
              {!guideError && !guideText && <p className="text-dark-text2">Loading guide…</p>}
              {!guideError && guideText}
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin min-h-0">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-lg px-3 py-2 text-xs ${
                        msg.role === 'user'
                          ? 'bg-dark-accent text-white'
                          : 'bg-dark-surface2 text-dark-text'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{msg.content}</div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-dark-surface2 rounded-lg px-3 py-2 text-xs text-dark-text2">
                      Thinking…
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-2 border-t border-dark-border shrink-0">
                <p className="text-[10px] text-dark-text2 mb-1.5 leading-snug">
                  Answers use only the bundled MHD guide via OpenRouter — not your calibration files.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void sendMessage();
                      }
                    }}
                    placeholder="Ask about MHD (antilag, safety, behavior)…"
                    className="flex-1 bg-dark-surface2 border border-dark-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-dark-accent"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => void sendMessage()}
                    disabled={loading || !input.trim()}
                    className="bg-dark-accent hover:bg-dark-accentHover text-white rounded px-3 py-1.5 text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
