import { DataTable } from "@/components/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

import { getSessionContext } from "@/lib/auth/session";
import { getActiveClientForOrg } from "@/lib/context/active-client";
import { fastapiFetch } from "@/lib/fastapiClient";

type EngineRunRow = {
  id: string;
  engineName: string;
  runStatus: string;
  promptId: string;
  startedAt: string | null;
  completedAt: string | null;
  errorMessage: string | null;
};

export const metadata = {
  title: "Engine Runs | GEO Command Center",
};

export default async function EngineRunsPage() {
  const session = await getSessionContext();
  if (!session?.currentOrgId) return null;
  const { activeClient } = await getActiveClientForOrg(session.currentOrgId);
  const projectId = activeClient?.id;
  if (!projectId) {
    return (
      <p className="text-sm text-muted-foreground">
        Select an active website to view engine runs.
      </p>
    );
  }

  const data = await fastapiFetch<{ items: EngineRunRow[] }>(
    `/engine-runs?project_id=${encodeURIComponent(projectId)}`,
    undefined,
    session.currentOrgId,
  ).catch(() => ({ items: [] }));

  const columns: ColumnDef<EngineRunRow>[] = [
    { accessorKey: "engineName", header: "Engine" },
    { accessorKey: "runStatus", header: "Status" },
    { accessorKey: "promptId", header: "Prompt ID" },
    { accessorKey: "startedAt", header: "Started" },
    { accessorKey: "completedAt", header: "Completed" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Engine Runs</h1>
        <p className="text-sm text-muted-foreground">
          Multi-engine execution log for ChatGPT, Google AI Overviews, Perplexity, Gemini, and Claude.
        </p>
      </div>
      <DataTable columns={columns} data={data.items} />
    </div>
  );
}
