"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { fastapiFetch } from "@/lib/fastapiClient";

type Props = {
  geoPackageId: string;
  projectId?: string;
  orgId?: string;
};

export function GeneratePromptPackButton({ geoPackageId, projectId, orgId }: Props) {
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true);
    try {
      if (!projectId) {
        window.alert("No active website selected.");
        return;
      }
      const body = await fastapiFetch<{ promptPackId: string }>("/workflows/prompt-pack", {
        method: "POST",
        body: JSON.stringify({ project_id: projectId, geoPackageId }),
      }, orgId);
      window.alert(`Prompt pack generated: ${body?.promptPackId ?? "ok"}`);
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="outline" onClick={generate} disabled={loading}>
      {loading ? "Generating..." : "Generate Prompt Pack"}
    </Button>
  );
}

