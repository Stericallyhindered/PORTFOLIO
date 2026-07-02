"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fastapiFetch } from "@/lib/fastapiClient";

type Props = {
  clientId?: string;
};

export function RunAuditButton({ clientId }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function runAudit() {
    const backendProjectId = process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID;
    if (!backendProjectId) {
      setMessage("No client available");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const body = await fastapiFetch<{ project_geo_score: number }>(
        `/scores/recompute/${encodeURIComponent(backendProjectId)}`,
        { method: "POST" },
      );
      setMessage(`FastAPI audit recompute completed (score ${body.project_geo_score})`);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={runAudit} disabled={loading || !process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID}>
        {loading ? "Queuing..." : "Run Content Audit"}
      </Button>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}

