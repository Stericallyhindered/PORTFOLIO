"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { fastapiFetch } from "@/lib/fastapiClient";

interface PipelineLog {
  id: string;
  pipelineRunId: string;
  timestamp: string | null;
  level: string;
  stage: string;
  message: string;
  progress: number;
  details: Record<string, unknown> | null;
}

interface ActivePipeline {
  id: string;
  projectId: string;
  projectName: string;
  domain: string;
  status: string;
  progress: number;
  targetTier: string;
  startedAt: string | null;
  celeryTaskId: string | null;
}

interface RecentRun {
  id: string;
  projectId: string;
  projectName: string;
  domain: string;
  status: string;
  progress: number;
  startedAt: string | null;
  completedAt: string | null;
  failureSummary: string | null;
}

interface SystemHealth {
  database: string;
  redis: string;
  celery: string;
  activeWorkers?: number;
}

interface DiagnosticsStatus {
  activePipelines: ActivePipeline[];
  recentRuns: RecentRun[];
  logs: PipelineLog[];
  systemHealth: SystemHealth;
}

const LEVEL_COLORS: Record<string, string> = {
  info: "text-blue-400",
  success: "text-green-400",
  warning: "text-yellow-400",
  error: "text-red-400",
};

const LEVEL_BG: Record<string, string> = {
  info: "bg-blue-500/10",
  success: "bg-green-500/10",
  warning: "bg-yellow-500/10",
  error: "bg-red-500/10",
};

export function DiagnosticConsole() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [status, setStatus] = useState<DiagnosticsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fastapiFetch<DiagnosticsStatus>("/diagnostics/status");
      setStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch diagnostics");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    
    pollIntervalRef.current = setInterval(fetchStatus, 2000);
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchStatus]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [status?.logs, autoScroll]);

  const copyLogs = useCallback(() => {
    if (!status?.logs) return;
    
    const logText = status.logs
      .map((log) => {
        const time = log.timestamp
          ? new Date(log.timestamp).toLocaleTimeString()
          : "??:??:??";
        return `${time} [${log.level.toUpperCase()}] [${log.stage}] ${log.message}`;
      })
      .join("\n");
    
    navigator.clipboard.writeText(logText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [status?.logs]);

  const clearLogs = useCallback(() => {
    setStatus((prev) => (prev ? { ...prev, logs: [] } : null));
  }, []);

  const activePipeline = status?.activePipelines?.[0];
  const hasActivePipeline = !!activePipeline;
  const progress = activePipeline?.progress ?? 0;

  if (isMinimized) {
    return (
      <div
        className="fixed bottom-4 right-4 z-50 cursor-pointer"
        onClick={() => setIsMinimized(false)}
      >
        <div
          className={`flex items-center gap-2 rounded-lg px-3 py-2 shadow-lg border ${
            hasActivePipeline
              ? "bg-blue-900/90 border-blue-500/50 text-blue-100"
              : "bg-gray-900/90 border-gray-700 text-gray-300"
          }`}
        >
          {hasActivePipeline ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span className="text-sm font-medium">
                Pipeline: {Math.round(progress * 100)}%
              </span>
            </>
          ) : (
            <>
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-sm">Diagnostics</span>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 transition-all duration-200 ${
        isExpanded ? "w-[600px]" : "w-[400px]"
      }`}
    >
      <div className="rounded-lg border border-gray-700 bg-gray-900/95 shadow-2xl backdrop-blur-sm">
        {/* Header */}
        <div
          className="flex items-center justify-between border-b border-gray-700 px-3 py-2 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-200">
              Diagnostic Console
            </span>
            {hasActivePipeline && (
              <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                Running
              </span>
            )}
            {error && (
              <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                Error
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              title="Minimize"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              className="rounded p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-200"
              title={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronUp className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Active Pipeline Status */}
        {hasActivePipeline && (
          <div className="border-b border-gray-700 px-3 py-2">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span className="font-medium">{activePipeline.domain}</span>
              <span className="text-gray-500">
                {activePipeline.targetTier} tier
              </span>
            </div>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-700">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-gray-400">
                Stage: {status?.logs?.[status.logs.length - 1]?.stage ?? "initializing"}
              </span>
              <span className="font-mono text-blue-400">
                {Math.round(progress * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* System Health (collapsed view) */}
        {!isExpanded && status?.systemHealth && (
          <div className="flex items-center gap-3 border-b border-gray-700 px-3 py-1.5 text-xs">
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  status.systemHealth.database === "healthy"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <span className="text-gray-400">DB</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  status.systemHealth.redis === "healthy"
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
              />
              <span className="text-gray-400">Redis</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={`h-2 w-2 rounded-full ${
                  status.systemHealth.celery === "healthy"
                    ? "bg-green-500"
                    : status.systemHealth.celery === "no workers"
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
              />
              <span className="text-gray-400">Celery</span>
            </div>
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && (
          <>
            {/* System Health (expanded view) */}
            {status?.systemHealth && (
              <div className="border-b border-gray-700 px-3 py-2">
                <div className="text-xs font-medium text-gray-400 mb-1">
                  System Health
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div
                    className={`rounded px-2 py-1 ${
                      status.systemHealth.database === "healthy"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    Database: {status.systemHealth.database}
                  </div>
                  <div
                    className={`rounded px-2 py-1 ${
                      status.systemHealth.redis === "healthy"
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    Redis: {status.systemHealth.redis}
                  </div>
                  <div
                    className={`rounded px-2 py-1 ${
                      status.systemHealth.celery === "healthy"
                        ? "bg-green-500/10 text-green-400"
                        : status.systemHealth.celery === "no workers"
                        ? "bg-yellow-500/10 text-yellow-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    Celery: {status.systemHealth.celery}
                    {status.systemHealth.activeWorkers !== undefined &&
                      ` (${status.systemHealth.activeWorkers} workers)`}
                  </div>
                </div>
              </div>
            )}

            {/* Logs */}
            <div className="max-h-[350px] overflow-y-auto px-3 py-2 font-mono text-xs">
              {status?.logs && status.logs.length > 0 ? (
                status.logs.map((log) => (
                  <div
                    key={log.id}
                    className={`mb-1 rounded px-2 py-1 ${LEVEL_BG[log.level] ?? "bg-gray-800"}`}
                  >
                    <span className="text-gray-500">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleTimeString()
                        : "??:??:??"}
                    </span>{" "}
                    <span className={LEVEL_COLORS[log.level] ?? "text-gray-300"}>
                      [{log.level.toUpperCase()}]
                    </span>{" "}
                    <span className="text-purple-400">[{log.stage}]</span>{" "}
                    <span className="text-gray-200">{log.message}</span>
                  </div>
                ))
              ) : (
                <div className="py-4 text-center text-gray-500">
                  {isLoading ? "Loading logs..." : "No logs yet. Run a pipeline to see activity."}
                </div>
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Recent Runs */}
            {status?.recentRuns && status.recentRuns.length > 0 && (
              <div className="border-t border-gray-700 px-3 py-2">
                <div className="text-xs font-medium text-gray-400 mb-1">
                  Recent Runs
                </div>
                <div className="space-y-1">
                  {status.recentRuns.slice(0, 3).map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center justify-between rounded bg-gray-800 px-2 py-1 text-xs"
                    >
                      <span className="text-gray-300 truncate max-w-[200px]">
                        {run.domain}
                      </span>
                      <span
                        className={
                          run.status === "completed"
                            ? "text-green-400"
                            : run.status === "failed"
                            ? "text-red-400"
                            : "text-yellow-400"
                        }
                      >
                        {run.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between border-t border-gray-700 px-3 py-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={copyLogs}
                  className="flex items-center gap-1 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-green-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  {copied ? "Copied!" : "Copy Logs"}
                </button>
                <button
                  onClick={clearLogs}
                  className="flex items-center gap-1 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300 hover:bg-gray-600"
                >
                  <Trash2 className="h-3 w-3" />
                  Clear
                </button>
              </div>
              <label className="flex items-center gap-1 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="h-3 w-3 rounded border-gray-600"
                />
                Auto-scroll
              </label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
