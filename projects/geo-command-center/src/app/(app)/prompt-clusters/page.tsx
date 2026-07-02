import { DataTable } from "@/components/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";

import { getSessionContext } from "@/lib/auth/session";
import { getActiveClientForOrg } from "@/lib/context/active-client";
import { GenerateBenchmarkPackButton } from "@/components/prompt-clusters/GenerateBenchmarkPackButton";
import { fastapiFetch } from "@/lib/fastapiClient";

type ClusterRow = {
  id: string;
  name: string;
  intentType: string;
  topic: string;
  priorityScore: number;
  createdAt: string | null;
  updatedAt?: string | null;
  generationSource?: string;
  promptCount?: number;
  runCount?: number;
  completedRunCount?: number;
  failedRunCount?: number;
  lastRunAt?: string | null;
  status?: string;
  hasFindings?: boolean;
  openRecommendations?: number;
  scoreCount?: number;
  avgScore?: number | null;
  avgCustomScore?: number | null;
  avgBenchmarkScore?: number | null;
  benchmarkVsCustomDelta?: number | null;
  lastError?: string | null;
};

export const metadata = {
  title: "Prompt Clusters | GEO Command Center",
};

export default async function PromptClustersPage() {
  const session = await getSessionContext();
  if (!session?.currentOrgId) return null;

  const { activeClient } = await getActiveClientForOrg(session.currentOrgId);
  const projectId = activeClient?.id;
  if (!projectId) {
    return (
      <p className="text-sm text-muted-foreground">
        Select an active website to view prompt clusters.
      </p>
    );
  }

  const data = await fastapiFetch<{ items: ClusterRow[] }>(
    `/prompts/clusters?project_id=${encodeURIComponent(projectId)}&include_stats=true`,
    undefined,
    session.currentOrgId,
  ).catch(() => ({ items: [] }));

  const items = data.items ?? [];
  const tested = items.filter((item) => item.status === "tested").length;
  const notTested = items.filter((item) => item.status === "not-tested").length;
  const failed = items.filter((item) => item.status === "failed").length;

  const columns: ColumnDef<ClusterRow>[] = [
    { accessorKey: "name", header: "Cluster" },
    { accessorKey: "intentType", header: "Intent" },
    { accessorKey: "topic", header: "Topic" },
    { accessorKey: "priorityScore", header: "Priority" },
    { accessorKey: "generationSource", header: "Source" },
    { accessorKey: "status", header: "Status" },
    { accessorKey: "promptCount", header: "Prompts" },
    { accessorKey: "runCount", header: "Runs" },
    { accessorKey: "openRecommendations", header: "Open Findings" },
    { accessorKey: "avgCustomScore", header: "Custom Score" },
    { accessorKey: "avgBenchmarkScore", header: "Benchmark Score" },
    { accessorKey: "benchmarkVsCustomDelta", header: "Delta" },
    { accessorKey: "lastRunAt", header: "Last Run" },
    { accessorKey: "createdAt", header: "Created" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Prompt Clusters</h1>
        <p className="text-sm text-muted-foreground">
          GEO prompt clusters are grouped intent families used to test visibility and citations across ChatGPT,
          Google AI Overviews, Perplexity, Gemini, and Claude for your active website.
        </p>
      </div>
      <GenerateBenchmarkPackButton
        projectId={projectId}
        orgId={session.currentOrgId}
      />
      <div className="grid gap-2 text-xs md:grid-cols-4">
        <div className="rounded border bg-card p-2">Active website: {activeClient?.websiteUrl ?? "—"}</div>
        <div className="rounded border bg-card p-2">Tested clusters: {tested}</div>
        <div className="rounded border bg-card p-2">Not tested: {notTested}</div>
        <div className="rounded border bg-card p-2">Failed: {failed}</div>
      </div>
      <DataTable columns={columns} data={items} />
      <div className="rounded-md border bg-card p-3 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">How this ties together</p>
        <p>
          Cluster {`->`} prompts {`->`} engine runs {`->`} citations/entities {`->`} GEO findings and recommendations.
          Use{" "}
          <Link className="underline" href="/app/engine-runs">
            Engine Runs
          </Link>{" "}
          and{" "}
          <Link className="underline" href="/app/content-audits">
            Content Audits
          </Link>{" "}
          to inspect evidence and implementation actions.
        </p>
      </div>
    </div>
  );
}
