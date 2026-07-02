"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fastapiFetch } from "@/lib/fastapiClient";

type Props = {
  projectId?: string;
  orgId?: string;
};

export function ClearAuditFindingsButton({ projectId, orgId }: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function clearAll() {
    if (!projectId) {
      setMessage("No active website selected.");
      return;
    }
    const confirmed = window.confirm("Delete all audit findings for this client?");
    if (!confirmed) return;
    setLoading(true);
    setMessage(null);
    try {
      await fastapiFetch(
        `/recommendations/clear?project_id=${encodeURIComponent(projectId)}`,
        {
          method: "POST",
        },
        orgId,
      );
      setMessage("Audit findings cleared.");
      window.location.reload();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Failed to clear findings.";
      if (text.includes("Project not found")) {
        setMessage(
          "This website no longer exists (likely reset). Refresh and select/configure a website.",
        );
      } else {
        setMessage(text);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={clearAll}
        disabled={!projectId || loading}
      >
        {loading ? "Clearing..." : "Clear All Findings"}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}

