"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fastapiFetch } from "@/lib/fastapiClient";

export function RecomputeCoverageButton({
  projectId,
  orgId,
}: {
  projectId?: string;
  orgId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
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
          "No engine runs yet for this website. Run Full GEO Pipeline first.",
        );
        return;
      }
      const body = await fastapiFetch<{ project_geo_score: number }>(
        `/scores/recompute/${encodeURIComponent(projectId)}?score_kind=custom`,
        { method: "POST" },
        orgId,
      );
      setMessage(`Coverage signals recomputed (project GEO ${body.project_geo_score}).`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to recompute coverage";
      setMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={run} disabled={loading || !projectId}>
        {loading ? "Running..." : "Recompute Coverage"}
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}

