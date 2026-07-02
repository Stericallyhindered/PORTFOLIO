"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { fastapiFetch } from "@/lib/fastapiClient";

export function AggregateVisibilityButton({
  projectId,
  orgId,
}: {
  projectId?: string;
  orgId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function triggerAggregation() {
    if (!projectId) {
      setMessage("No active website selected.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const runs = await fastapiFetch<{ items: Array<{ id: string }> }>(
        `/engine-runs?project_id=${encodeURIComponent(projectId)}`,
        undefined,
        orgId,
      );
      if ((runs.items ?? []).length === 0) {
        setMessage(
          "No engine runs yet for this website. Run Full GEO Pipeline first, then refresh visibility.",
        );
        return;
      }

      const body = await fastapiFetch<{ project_geo_score: number }>(
        `/scores/recompute/${encodeURIComponent(projectId)}?score_kind=custom`,
        {
          method: "POST",
        },
        orgId,
      );
      setMessage(
        `Visibility refreshed (project GEO ${body.project_geo_score.toFixed(2)}).`,
      );
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("No engine runs available")
      ) {
        setMessage(
          "No engine runs yet for this website. Run Full GEO Pipeline first, then refresh visibility.",
        );
        return;
      }
      setMessage(
        error instanceof Error
          ? error.message
          : "Unexpected error while refreshing visibility.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={triggerAggregation}
        disabled={loading || !projectId}
      >
        {loading ? "Refreshing..." : "Refresh Visibility"}
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}

