"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function ResetWorkspaceDataButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const router = useRouter();

  async function resetData() {
    const confirmed = window.confirm(
      "This will DELETE all website/client GEO data in the current org. Continue?",
    );
    if (!confirmed) return;

    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/reset-workspace-data", {
        method: "POST",
      });
      const body = await res
        .json()
        .catch(() => ({ ok: false, error: "Reset failed" }));
      if (!res.ok || body?.ok === false) {
        setMessage(
          body?.error ??
            "Reset did not fully complete. Backend may be temporarily unavailable.",
        );
        return;
      }
      setMessage(
        `Workspace data cleared (${body?.clearedProjects ?? 0} project(s)).`,
      );
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="destructive"
        size="sm"
        disabled={loading}
        onClick={resetData}
      >
        {loading ? "Clearing..." : "Clear All Website Data"}
      </Button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}

