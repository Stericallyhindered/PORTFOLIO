import { db } from "@/db/client";
import { brandEntities, competitorEntities, clients } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { DataTable } from "@/components/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { eq } from "drizzle-orm";
import { getEntityCoverageSummaryForClient } from "@/lib/entities/coverage";
import { RecomputeCoverageButton } from "@/components/entities/RecomputeCoverageButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveClientForOrg } from "@/lib/context/active-client";
import { fastapiFetch } from "@/lib/fastapiClient";

type EntityRow = {
  id: string;
  name: string;
  type: string;
  kind: string;
  clientName: string;
};

export const metadata = {
  title: "Entities | GEO Command Center",
};

export default async function EntitiesPage() {
  const session = await getSessionContext();

  if (!session || !session.currentOrgId) {
    return null;
  }

  const { activeClient } = await getActiveClientForOrg(session.currentOrgId);
  const backendOverview = await fastapiFetch<{
    entities: Array<{ name: string; kind: string; type: string }>;
  }>("/reports/org-overview", undefined, session.currentOrgId).catch(() => null);

  if (backendOverview && backendOverview.entities.length > 0) {
    const data: EntityRow[] = backendOverview.entities.map((e, index) => ({
      id: `${e.name}-${index}`,
      name: e.name,
      type: e.type,
      kind: e.kind,
      clientName: activeClient?.name ?? "Org",
    }));
    const columns: ColumnDef<EntityRow>[] = [
      { accessorKey: "name", header: "Entity" },
      { accessorKey: "kind", header: "Kind" },
      { accessorKey: "type", header: "Type" },
      { accessorKey: "clientName", header: "Client" },
    ];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Entities</h1>
            <p className="text-sm text-muted-foreground">FastAPI-backed entity dataset.</p>
          </div>
          <RecomputeCoverageButton
            projectId={activeClient?.id}
            orgId={session.currentOrgId}
          />
        </div>
        <DataTable columns={columns} data={data} />
      </div>
    );
  }

  const brandRows =
    activeClient == null
      ? []
      : await db
          .select()
          .from(brandEntities)
          .where(eq(brandEntities.clientId, activeClient.id))
          .limit(100);
  const competitorRows =
    activeClient == null
      ? []
      : await db
          .select()
          .from(competitorEntities)
          .where(eq(competitorEntities.clientId, activeClient.id))
          .limit(100);
  const coverageSummary = activeClient
    ? await getEntityCoverageSummaryForClient(activeClient.id)
    : [];

  const data: EntityRow[] = [
    ...brandRows.map((e) => ({
      id: e.id,
      name: e.entityName,
      type: e.entityType,
      kind: "Brand",
      clientName: activeClient?.name ?? "Client",
    })),
    ...competitorRows.map((e) => ({
      id: e.id,
      name: e.entityName,
      type: e.entityType,
      kind: "Competitor",
      clientName: activeClient?.name ?? "Client",
    })),
  ];

  const columns: ColumnDef<EntityRow>[] = [
    {
      accessorKey: "name",
      header: "Entity",
    },
    {
      accessorKey: "kind",
      header: "Kind",
    },
    {
      accessorKey: "type",
      header: "Type",
    },
    {
      accessorKey: "clientName",
      header: "Client",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Entities</h1>
          <p className="text-sm text-muted-foreground">
            Manage brand and competitor entities that your GEO program targets in
            AI answers.
          </p>
        </div>
        <RecomputeCoverageButton
          projectId={activeClient?.id}
          orgId={session.currentOrgId}
        />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {coverageSummary.slice(0, 3).map((item) => (
          <Card key={item.entityId}>
            <CardHeader>
              <CardTitle className="text-sm">{item.entityName}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs">
              <p>Avg score: {item.averageCoverageScore}</p>
              <p>Sampled pages: {item.sampledPages}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}

