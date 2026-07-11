"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fastapiFetch } from "@/lib/fastapiClient";

export function GenerateReportButton({
  projectId,
  orgId,
}: {
  projectId?: string;
  orgId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function generate() {
    if (!projectId) {
      setMessage("No active website selected.");
      return;
    }
    setLoading(true);
    setMessage(null);

    try {
      const body = await fastapiFetch<{ report_export_id: string; storage_path: string }>(
        `/reports/generate?project_id=${encodeURIComponent(projectId)}&report_type=json`,
        {
          method: "POST",
        },
        orgId,
      );
      setMessage(`Report generated (${body.report_export_id})`);
      window.location.reload();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to generate";
      setMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={generate} disabled={loading || !projectId}>
        {loading ? "Generating..." : "Generate Client Update"}
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}

