"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fastapiFetch } from "@/lib/fastapiClient";

type Props = {
  projectId?: string;
  websiteUrl?: string;
  orgId?: string;
};

export function PurgeBlendedHistoryButton({ projectId, websiteUrl, orgId }: Props) {
  const [loading, setLoading] = useState(false);

  async function purge() {
    if (!projectId) return;
    const confirmed = window.confirm(
      `Purge blended history for ${websiteUrl ?? "this website"}?\n\nThis removes old mixed pages/audits/packages from previous cross-website runs.`,
    );
    if (!confirmed) return;

    setLoading(true);
    try {
      const body = await fastapiFetch<{
        deletedAuditCount: number;
        deletedPageCount: number;
        deletedDeliverableCount: number;
      }>(`/recommendations/purge-blended-history?project_id=${encodeURIComponent(projectId)}`, {
        method: "POST",
      }, orgId);
      window.alert(
        `Purged.\nAudits: ${body?.deletedAuditCount ?? 0}\nPages: ${body?.deletedPageCount ?? 0}\nPackages: ${body?.deletedDeliverableCount ?? 0}`,
      );
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={purge}
      disabled={!projectId || loading}
    >
      {loading ? "Purging..." : "Purge Blended History"}
    </Button>
  );
}

