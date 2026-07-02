"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fastapiFetch } from "@/lib/fastapiClient";

type Props = {
  defaultClientId?: string;
  defaultWebsiteUrl?: string;
};

type RunResult = {
  clientName: string;
  websiteUrl: string;
  auditedPages: number;
};

export function WebsiteAuditRunner({ defaultClientId, defaultWebsiteUrl }: Props) {
  const [websiteUrl, setWebsiteUrl] = useState(defaultWebsiteUrl ?? "");
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RunResult | null>(null);

  async function runWorkflow(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const backendProjectId = process.env.NEXT_PUBLIC_DEFAULT_PROJECT_ID;
      if (!backendProjectId) {
        setError("Set NEXT_PUBLIC_DEFAULT_PROJECT_ID before running website audits.");
        return;
      }
      const body = await fastapiFetch<{
        clientName: string;
        websiteUrl: string;
        auditedPages: number;
      }>("/workflows/website-audit", {
        method: "POST",
        body: JSON.stringify({
          project_id: backendProjectId,
          website_url: websiteUrl,
          client_name: clientName || undefined,
        }),
      });
      setResult({
        clientName: String(body.clientName ?? "Client"),
        websiteUrl: String(body.websiteUrl ?? websiteUrl),
        auditedPages: Number(body.auditedPages ?? 0),
      });
      window.location.reload();
    } catch {
      setError("Unexpected error running workflow");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={runWorkflow} className="rounded-md border bg-background p-3">
      <div className="space-y-2">
        <p className="text-sm font-medium">Run GEO Website Audit</p>
        <p className="text-xs text-muted-foreground">
          Enter a website URL to crawl pages and generate GEO audit recommendations.
        </p>
      </div>

      <div className="mt-3 grid gap-2 md:grid-cols-3">
        <Input
          placeholder="https://yourcompany.com"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          required
        />
        <Input
          placeholder="Client name (optional)"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Crawling + Auditing..." : "Run Crawl + GEO Audit"}
        </Button>
      </div>

      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      {result && (
        <p className="mt-2 text-xs text-muted-foreground">
          Completed for {result.clientName} ({result.websiteUrl}). Audited{" "}
          {result.auditedPages} pages.
        </p>
      )}
    </form>
  );
}

