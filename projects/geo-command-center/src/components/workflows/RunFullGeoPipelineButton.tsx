"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fastapiFetch } from "@/lib/fastapiClient";

type Props = {
  projectId?: string;
  websiteUrl?: string;
  orgId?: string;
};

function parseFastapiErrorDetail(raw: string): { message?: string; blockingEngines?: Array<{ engine: string; errorCode?: string }> } | null {
  const jsonStart = raw.indexOf("{");
  if (jsonStart < 0) return null;
  try {
    const parsed = JSON.parse(raw.slice(jsonStart));
    const detail = parsed?.detail;
    if (detail && typeof detail === "object") {
      return detail as { message?: string; blockingEngines?: Array<{ engine: string; errorCode?: string }> };
    }
    return null;
  } catch {
    return null;
  }
}

export function RunFullGeoPipelineButton({ projectId, websiteUrl, orgId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function runPipeline() {
    if (!projectId) {
      setMessage("No active website selected.");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const body = await fastapiFetch<{ run_id: string | null }>("/crawl/full-pipeline", {
        method: "POST",
        body: JSON.stringify({
          project_id: projectId,
          domain: (websiteUrl ?? "").replace(/^https?:\/\//, "").split("/")[0],
        }),
      }, orgId);
      setMessage(`Pipeline queued. Run ID: ${body.run_id ?? "n/a"}`);
      window.location.reload();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to queue pipeline.";
      const detail = parseFastapiErrorDetail(text);
      if (detail?.blockingEngines && detail.blockingEngines.length > 0) {
        const failing = detail.blockingEngines
          .map((item) => `${item.engine}${item.errorCode ? `(${item.errorCode})` : ""}`)
          .join(", ");
        setMessage(`${detail.message ?? "Provider preflight blocked run."} Failing: ${failing}`);
      } else {
        setMessage(text);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={runPipeline} disabled={loading || !projectId || !websiteUrl}>
        {loading ? "Running Full Pipeline..." : "Run Full GEO Pipeline"}
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}

