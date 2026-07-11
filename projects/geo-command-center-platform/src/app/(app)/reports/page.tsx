import { db } from "@/db/client";
import { deliverables, clients } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { DataTable } from "@/components/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { and, eq, inArray } from "drizzle-orm";
import { GenerateReportButton } from "@/components/reports/GenerateReportButton";
import Link from "next/link";
import { getActiveClientForOrg } from "@/lib/context/active-client";
import { fastapiFetch } from "@/lib/fastapiClient";

type ReportRow = {
  id: string;
  title: string;
  reportPath: string;
  clientName: string;
  status: string;
};

export const metadata = {
  title: "Reports | GEO Command Center",
};

export default async function ReportsPage() {
  const session = await getSessionContext();

  if (!session || !session.currentOrgId) {
    return null;
  }

  const { activeClient } = await getActiveClientForOrg(session.currentOrgId);
  const backendOverview = await fastapiFetch<{
    reports: Array<{ id: string; title: string; status: string }>;
  }>("/reports/org-overview", undefined, session.currentOrgId).catch(() => null);

  if (backendOverview && backendOverview.reports.length > 0) {
    const data: ReportRow[] = backendOverview.reports.map((r) => ({
      id: r.id,
      title: r.title,
      reportPath: `/app/reports/${r.id}`,
      clientName: activeClient?.name ?? "Org",
      status: r.status,
    }));
    const columns: ColumnDef<ReportRow>[] = [
      { accessorKey: "title", header: "Report" },
      { accessorKey: "clientName", header: "Client" },
      { accessorKey: "status", header: "Status" },
    ];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Reports</h1>
            <p className="text-sm text-muted-foreground">
              FastAPI-backed report exports and delivery status.
            </p>
          </div>
          <GenerateReportButton
            projectId={activeClient?.id}
            orgId={session.currentOrgId}
          />
        </div>
        <DataTable columns={columns} data={data} />
      </div>
    );
  }

  const reportRows =
    activeClient == null
      ? []
      : await db
          .select()
          .from(deliverables)
          .where(
            and(
              eq(deliverables.type, "monthly_report"),
              eq(deliverables.orgId, session.currentOrgId),
              eq(deliverables.clientId, activeClient.id),
            ),
          )
          .limit(100);

  const clientIds = Array.from(new Set(reportRows.map((r) => r.clientId)));
  const clientRows =
    clientIds.length === 0
      ? []
      : await db.select().from(clients).where(inArray(clients.id, clientIds));

  const clientById = new Map(clientRows.map((c) => [c.id, c.name]));

  const data: ReportRow[] = reportRows.map((r) => ({
    id: r.id,
    title: r.title,
    reportPath: `/app/reports/${r.id}`,
    clientName: clientById.get(r.clientId) ?? "Client",
    status: r.status,
  }));

  const columns: ColumnDef<ReportRow>[] = [
    {
      accessorKey: "title",
      header: "Report",
    },
    {
      accessorKey: "clientName",
      header: "Client",
    },
    {
      accessorKey: "status",
      header: "Status",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">
            Monthly GEO reports per client with AI visibility, competitive
            context, shipped work, and next-month recommendations.
          </p>
        </div>
        <GenerateReportButton
          projectId={activeClient?.id}
          orgId={session.currentOrgId}
        />
      </div>
      <DataTable columns={columns} data={data} />
      {data.length > 0 && (
        <div className="space-y-1">
          <h2 className="text-sm font-medium">Open Reports</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {data.slice(0, 8).map((report) => (
              <Link
                key={report.id}
                href={report.reportPath}
                className="rounded border px-2 py-1 hover:bg-muted"
              >
                {report.title}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

