"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ApprovalActions({ deliverableId }: { deliverableId: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(status: "approved" | "rejected") {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliverableId, status }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setMessage(body?.error ?? "Failed to submit approval");
      } else {
        setMessage(`Submitted: ${status}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        onClick={() => submit("approved")}
        disabled={loading}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => submit("rejected")}
        disabled={loading}
      >
        Reject
      </Button>
      {message && <span className="text-xs text-muted-foreground">{message}</span>}
    </div>
  );
}

