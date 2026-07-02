"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { fastapiFetch } from "@/lib/fastapiClient";

type AuditInsight = {
  id: string;
  url: string;
  score: number | null;
  auditDate: string;
  issues: string[];
  recommendations: string[];
  dimensions?: Array<{ id: string; score: number; status: string }>;
  confidence?: number;
  currentVsImproved?: Array<{
    location: string;
    whyThisMatters: string;
    current: string;
    improved: string;
    implementationEffort: string;
    citationLikelihood: number;
    dimension: string;
  }>;
  engineEvidence?: Array<{
    engine: string;
    score: number;
    confidence: number;
    summary: string;
  }>;
  schemaSuggestions?: Array<{
    targetUrl: string;
    recommendedNodes: string[];
    insertionPoint: string;
    why: string;
  }>;
  geoAiOptimizations?: Array<{
    category: string;
    priority: string;
    action: string;
    whyItImprovesAiDiscovery: string;
  }>;
};

type Props = {
  insights: AuditInsight[];
  projectId?: string;
  orgId?: string;
};

export function LatestAuditFindingsPanel({ insights, projectId, orgId }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const allSelected = useMemo(
    () => insights.length > 0 && selected.size === insights.length,
    [insights.length, selected.size],
  );

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (insights.length === 0) return prev;
      if (prev.size === insights.length) return new Set();
      return new Set(insights.map((i) => i.id));
    });
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    const confirmed = window.confirm(`Delete ${selected.size} selected findings?`);
    if (!confirmed) return;

    setLoading(true);
    try {
      if (!projectId) {
        return;
      }
      const res = await fastapiFetch<{ deletedCount: number }>(
        "/recommendations/bulk-delete",
        {
          method: "POST",
          body: JSON.stringify({ scoreIds: Array.from(selected), projectId }),
        },
        orgId,
      );
      if (res.deletedCount >= 0) {
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  }

  if (insights.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        No findings yet. Run a crawl + GEO audit and results will appear here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={toggleAll}>
          {allSelected ? "Unselect All" : "Select All"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={deleteSelected}
          disabled={selected.size === 0 || loading}
        >
          {loading ? "Deleting..." : `Delete Selected (${selected.size})`}
        </Button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {insights.map((insight) => (
          <div key={insight.id} className="rounded-md border p-3 text-xs">
            <label className="mb-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.has(insight.id)}
                onChange={() => toggleOne(insight.id)}
              />
              <span>Select</span>
            </label>
            <p className="font-medium">{insight.url}</p>
            <p className="text-muted-foreground">
              Score: {insight.score == null ? "—" : insight.score} ·{" "}
              {new Date(insight.auditDate).toLocaleDateString()}
            </p>
            {typeof insight.confidence === "number" ? (
              <p className="text-muted-foreground">
                Confidence: {(insight.confidence * 100).toFixed(1)}%
              </p>
            ) : null}
            {insight.dimensions && insight.dimensions.length > 0 ? (
              <div className="mt-2 rounded border bg-muted/30 p-2">
                <p className="font-medium">Dimension Scores</p>
                <div className="mt-1 grid gap-1">
                  {insight.dimensions.map((d) => (
                    <p key={`${insight.id}-${d.id}`}>
                      {d.id}: {d.score} ({d.status})
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            <div className="mt-2 space-y-1">
              <p className="font-medium">Issues</p>
              {insight.issues.length === 0 ? (
                <p className="text-muted-foreground">No issues captured.</p>
              ) : (
                <ul className="list-disc pl-4">
                  {insight.issues.map((issue, idx) => (
                    <li key={`${insight.id}-issue-${idx}`}>{issue}</li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-2 space-y-1">
              <p className="font-medium">Recommended actions</p>
              {insight.recommendations.length === 0 ? (
                <p className="text-muted-foreground">No recommendations captured.</p>
              ) : (
                <ul className="list-disc pl-4">
                  {insight.recommendations.map((action, idx) => (
                    <li key={`${insight.id}-action-${idx}`}>{action}</li>
                  ))}
                </ul>
              )}
            </div>
            {insight.currentVsImproved && insight.currentVsImproved.length > 0 ? (
              <div className="mt-2 space-y-1">
                <p className="font-medium">Current vs Improved</p>
                {insight.currentVsImproved.slice(0, 2).map((item, idx) => (
                  <div key={`${insight.id}-cvi-${idx}`} className="rounded border p-2">
                    <p className="font-medium">{item.location}</p>
                    <p className="text-muted-foreground">{item.whyThisMatters}</p>
                    <p>
                      <span className="font-medium">Current:</span> {item.current}
                    </p>
                    <p>
                      <span className="font-medium">Improved:</span> {item.improved}
                    </p>
                    <p className="text-muted-foreground">
                      Effort: {item.implementationEffort} · Citation likelihood:{" "}
                      {item.citationLikelihood}%
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            {insight.engineEvidence && insight.engineEvidence.length > 0 ? (
              <div className="mt-2 space-y-1">
                <p className="font-medium">Engine Attribution</p>
                {insight.engineEvidence.map((ev, idx) => (
                  <p key={`${insight.id}-engine-${idx}`}>
                    {ev.engine}: {ev.score} ({(ev.confidence * 100).toFixed(0)}%) - {ev.summary}
                  </p>
                ))}
              </div>
            ) : null}
            {insight.schemaSuggestions && insight.schemaSuggestions.length > 0 ? (
              <div className="mt-2 space-y-1">
                <p className="font-medium">Suggested Schema Changes (Per Page)</p>
                {insight.schemaSuggestions.slice(0, 3).map((s, idx) => (
                  <div key={`${insight.id}-schema-${idx}`} className="rounded border p-2">
                    <p className="font-medium">{s.targetUrl || insight.url}</p>
                    <p>
                      Nodes:{" "}
                      {s.recommendedNodes.length > 0
                        ? s.recommendedNodes.join(", ")
                        : "WebPage"}
                    </p>
                    <p>Insertion: {s.insertionPoint}</p>
                    <p className="text-muted-foreground">{s.why}</p>
                  </div>
                ))}
              </div>
            ) : null}
            {insight.geoAiOptimizations && insight.geoAiOptimizations.length > 0 ? (
              <div className="mt-2 space-y-1">
                <p className="font-medium">GEO for AI/Chat Optimization</p>
                {insight.geoAiOptimizations.slice(0, 4).map((g, idx) => (
                  <div key={`${insight.id}-geo-${idx}`} className="rounded border p-2">
                    <p className="font-medium">
                      {g.category} ({g.priority})
                    </p>
                    <p>{g.action}</p>
                    <p className="text-muted-foreground">{g.whyItImprovesAiDiscovery}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

