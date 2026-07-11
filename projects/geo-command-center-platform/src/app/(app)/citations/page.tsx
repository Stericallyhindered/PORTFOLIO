import { DataTable } from "@/components/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";

import { getSessionContext } from "@/lib/auth/session";
import { getActiveClientForOrg } from "@/lib/context/active-client";
import { fastapiFetch } from "@/lib/fastapiClient";

type CitationRow = {
  id: string;
  cited_domain: string | null;
  cited_url: string | null;
  mention_type: string | null;
  confidence: number | null;
  citation_order: number | null;
  is_brand: boolean;
  is_competitor: boolean;
  created_at: string;
};

export const metadata = {
  title: "Citations Explorer | GEO Command Center",
};

export default async function CitationsPage() {
  const session = await getSessionContext();
  if (!session?.currentOrgId) return null;
  const { activeClient } = await getActiveClientForOrg(session.currentOrgId);
  const projectId = activeClient?.id;
  if (!projectId) {
    return (
      <p className="text-sm text-muted-foreground">
        Select an active website to view citations.
      </p>
    );
  }

  const data = await fastapiFetch<{ items: CitationRow[] }>(
    `/citations?project_id=${encodeURIComponent(projectId)}`,
    undefined,
    session.currentOrgId,
  ).catch(() => ({ items: [] }));

  const columns: ColumnDef<CitationRow>[] = [
    { accessorKey: "cited_domain", header: "Domain" },
    { accessorKey: "mention_type", header: "Mention Type" },
    { accessorKey: "confidence", header: "Confidence" },
    { accessorKey: "citation_order", header: "Order" },
    { accessorKey: "cited_url", header: "URL" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Citations Explorer</h1>
        <p className="text-sm text-muted-foreground">
          Evidence table of AI citations with mention classification and confidence.
        </p>
      </div>
      <DataTable columns={columns} data={data.items} />
    </div>
  );
}
