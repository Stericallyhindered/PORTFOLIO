import { db } from "@/db/client";
import { clients, visibilityMetricsDaily } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { eq, inArray } from "drizzle-orm";

export const metadata = {
  title: "Agency Overview | GEO Command Center",
};

export default async function AdminHomePage() {
  const session = await getSessionContext();

  if (!session || !session.currentOrgId) {
    return null;
  }

  const agencyOrgId = session.currentOrgId;

  const clientRows = await db
    .select()
    .from(clients)
    .where(eq(clients.orgId, agencyOrgId));

  const clientIds = clientRows.map((c) => c.id);

  const metrics =
    clientIds.length === 0
      ? []
      : await db
          .select()
          .from(visibilityMetricsDaily)
          .where(inArray(visibilityMetricsDaily.clientId, clientIds))
          .limit(100);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">{clientRows.length}</div>
          <p className="text-xs text-muted-foreground">
            Active client organizations managed by this agency.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tracked Clients with Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-semibold">
            {new Set(metrics.map((m) => m.clientId)).size}
          </div>
          <p className="text-xs text-muted-foreground">
            Clients with at least one visibility metric in the current
            workspace.
          </p>
        </CardContent>
      </Card>

      <Card className="md:col-span-3">
        <CardHeader>
          <CardTitle>At-risk overview</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          At-risk alerts will surface here once SLA rules and GEO thresholds
          are configured.
        </CardContent>
      </Card>
    </div>
  );
}

