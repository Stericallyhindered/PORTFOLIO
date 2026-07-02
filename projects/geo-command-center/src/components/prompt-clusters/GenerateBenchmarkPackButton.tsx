"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { fastapiFetch } from "@/lib/fastapiClient";

export function GenerateBenchmarkPackButton({
  projectId,
  orgId,
}: {
  projectId?: string;
  orgId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generateBenchmarkPack() {
    if (!projectId) {
      setMessage("No active website selected.");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const result = await fastapiFetch<{ clusters_created: number; pack: string }>(
        `/prompts/benchmark-pack?project_id=${encodeURIComponent(projectId)}`,
        { method: "POST" },
        orgId,
      );
      setMessage(
        `Benchmark pack ${result.pack} synced (${result.clusters_created} clusters).`,
      );
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to sync benchmark pack.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={generateBenchmarkPack}
        disabled={loading || !projectId}
      >
        {loading ? "Syncing..." : "Sync Benchmark Pack"}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}
