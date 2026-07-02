"use client";

import { useEffect, useState, useCallback } from "react";
import { fastapiFetch } from "@/lib/fastapiClient";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, RefreshCw, Download } from "lucide-react";

type Props = {
  projectId: string;
  orgId?: string;
};

type EngineResponse = {
  engineName: string;
  status: string;
  responseText: string | null;
  completedAt: string | null;
  debug?: {
    model?: string | null;
    promptHash?: string | null;
    systemPrompt?: string | null;
    userPrompt?: string | null;
    params?: Record<string, unknown> | null;
  } | null;
};

type PromptItem = {
  id: string;
  promptText: string;
  topic?: string | null;
  intent?: string | null;
  audience?: string | null;
  competitor?: string | null;
  qualityScore?: number | null;
  priorityTier?: string | null;
  funnelStage?: string | null;
  useCase?: string | null;
  sourceLayer?: string | null;
  responses?: EngineResponse[];
};

type PromptsResponse = {
  items: PromptItem[];
  total: number;
  limit: number;
  offset: number;
};

const ENGINE_COLORS: Record<string, string> = {
  chatgpt: "bg-green-100 text-green-800 border-green-200",
  perplexity: "bg-purple-100 text-purple-800 border-purple-200",
  claude: "bg-orange-100 text-orange-800 border-orange-200",
  gemini: "bg-blue-100 text-blue-800 border-blue-200",
  "google-ai-overviews": "bg-red-100 text-red-800 border-red-200",
};

export function GeneratedPromptsPanel({ projectId, orgId }: Props) {
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [expandedPrompts, setExpandedPrompts] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [includeResponses, setIncludeResponses] = useState(true);
  const pageSize = 20;

  const fetchPrompts = async (pageNum: number = 1) => {
    setLoading(true);
    setError(null);
    try {
      const offset = (pageNum - 1) * pageSize;
      const endpoint = includeResponses
        ? `/prompts/universe/prompts-with-responses/${projectId}?limit=${pageSize}&offset=${offset}`
        : `/prompts/universe/prompts/${projectId}?limit=${pageSize}&offset=${offset}`;
      
      const data = await fastapiFetch<PromptsResponse>(
        endpoint,
        undefined,
        orgId
      );
      setPrompts(data.items || []);
      setTotal(data.total || 0);
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load prompts");
      setPrompts([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const data = await fastapiFetch<Record<string, unknown>>(
        `/prompts/universe/download/${projectId}`,
        undefined,
        orgId
      );
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prompts-with-responses-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download prompts");
    } finally {
      setDownloading(false);
    }
  };

  const togglePromptExpanded = (promptId: string) => {
    setExpandedPrompts(prev => {
      const next = new Set(prev);
      if (next.has(promptId)) {
        next.delete(promptId);
      } else {
        next.add(promptId);
      }
      return next;
    });
  };

  // Auto-refresh every 10 seconds when expanded to catch new prompts from running pipeline
  useEffect(() => {
    if (expanded && prompts.length === 0 && !loading) {
      fetchPrompts(1);
    }
  }, [expanded]);

  useEffect(() => {
    if (!expanded) return;
    
    const interval = setInterval(() => {
      fetchPrompts(page);
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [expanded, page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="rounded-md border bg-background">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Generated Prompts</span>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">({total.toLocaleString()} total)</span>
          )}
        </div>
        {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="border-t p-3 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-xs text-muted-foreground">
              Showing {prompts.length} of {total.toLocaleString()} prompts
              {includeResponses && " (with AI responses)"}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAll}
                disabled={downloading || total === 0}
                className="h-7 text-xs"
              >
                <Download className={`h-3 w-3 mr-1 ${downloading ? "animate-pulse" : ""}`} />
                {downloading ? "Downloading..." : "Download All"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchPrompts(page)}
                disabled={loading}
                className="h-7 text-xs"
              >
                <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          {loading && prompts.length === 0 && (
            <p className="text-xs text-muted-foreground">Loading prompts...</p>
          )}

          {!loading && prompts.length === 0 && !error && (
            <p className="text-xs text-muted-foreground">
              No prompts generated yet. Run the GEO pipeline to generate prompts.
            </p>
          )}

          {prompts.length > 0 && (
            <>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {prompts.map((prompt) => {
                  const isPromptExpanded = expandedPrompts.has(prompt.id);
                  const hasResponses = prompt.responses && prompt.responses.length > 0;
                  
                  return (
                    <div
                      key={prompt.id}
                      className="rounded border bg-card text-xs"
                    >
                      {/* Prompt Header */}
                      <div 
                        className={`p-2 space-y-1 ${hasResponses ? "cursor-pointer hover:bg-muted/30" : ""}`}
                        onClick={() => hasResponses && togglePromptExpanded(prompt.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-1">
                            {hasResponses && (
                              <span className="text-muted-foreground">
                                {isPromptExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                              </span>
                            )}
                            <p className="font-medium">{prompt.promptText}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {hasResponses && (
                              <span className="text-muted-foreground">
                                {prompt.responses!.length} response{prompt.responses!.length !== 1 ? "s" : ""}
                              </span>
                            )}
                            {prompt.qualityScore != null && (
                              <span className="text-muted-foreground whitespace-nowrap">
                                Q: {(prompt.qualityScore * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 text-muted-foreground">
                          {prompt.intent && (
                            <span className="bg-muted px-1.5 py-0.5 rounded">{prompt.intent}</span>
                          )}
                          {prompt.topic && (
                            <span className="bg-muted px-1.5 py-0.5 rounded">{prompt.topic}</span>
                          )}
                          {prompt.audience && (
                            <span className="bg-muted px-1.5 py-0.5 rounded">{prompt.audience}</span>
                          )}
                          {prompt.competitor && (
                            <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">vs {prompt.competitor}</span>
                          )}
                          {prompt.priorityTier && (
                            <span className={`px-1.5 py-0.5 rounded ${
                              prompt.priorityTier === "1" || prompt.priorityTier === "core" ? "bg-green-100 text-green-800" :
                              prompt.priorityTier === "2" || prompt.priorityTier === "expanded" ? "bg-yellow-100 text-yellow-800" :
                              "bg-gray-100 text-gray-800"
                            }`}>
                              tier {prompt.priorityTier}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* AI Responses (Expanded) */}
                      {isPromptExpanded && hasResponses && (
                        <div className="border-t bg-muted/20 p-2 space-y-2">
                          {prompt.responses!.map((response, idx) => (
                            <div 
                              key={idx} 
                              className={`rounded border p-2 ${ENGINE_COLORS[response.engineName] || "bg-gray-100 text-gray-800 border-gray-200"}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium capitalize">{response.engineName}</span>
                                <span className={`text-xs ${response.status === "completed" ? "text-green-600" : "text-yellow-600"}`}>
                                  {response.status}
                                </span>
                              </div>
                              {response.responseText ? (
                                <div className="bg-white/50 rounded p-2 text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                                  {response.responseText}
                                </div>
                              ) : (
                                <p className="text-xs italic opacity-70">No response yet</p>
                              )}
                              {response.debug && (
                                <details className="mt-2 bg-white/50 rounded p-2 text-[11px] text-gray-700">
                                  <summary className="cursor-pointer font-medium">
                                    Request debug
                                  </summary>
                                  <div className="mt-2 space-y-1">
                                    {response.debug.model && (
                                      <p>
                                        <strong>Model:</strong> {response.debug.model}
                                      </p>
                                    )}
                                    {response.debug.promptHash && (
                                      <p>
                                        <strong>Prompt hash:</strong> {response.debug.promptHash}
                                      </p>
                                    )}
                                    {response.debug.systemPrompt && (
                                      <div>
                                        <p><strong>System prompt:</strong></p>
                                        <pre className="whitespace-pre-wrap overflow-x-auto rounded bg-white p-1">
                                          {response.debug.systemPrompt}
                                        </pre>
                                      </div>
                                    )}
                                    {response.debug.userPrompt && (
                                      <div>
                                        <p><strong>User prompt:</strong></p>
                                        <pre className="whitespace-pre-wrap overflow-x-auto rounded bg-white p-1">
                                          {response.debug.userPrompt}
                                        </pre>
                                      </div>
                                    )}
                                    {response.debug.params && (
                                      <div>
                                        <p><strong>Request params:</strong></p>
                                        <pre className="whitespace-pre-wrap overflow-x-auto rounded bg-white p-1">
                                          {JSON.stringify(response.debug.params, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                </details>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPrompts(page - 1)}
                    disabled={page <= 1 || loading}
                    className="h-7 text-xs"
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPrompts(page + 1)}
                    disabled={page >= totalPages || loading}
                    className="h-7 text-xs"
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
