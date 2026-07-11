import { db } from "@/db/client";
import Link from "next/link";
import {
  clients,
  contentAudits,
  deliverables,
  pages,
  visibilityMetricsDaily,
  tasks,
  sprints,
} from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RunFullGeoPipelineButton } from "@/components/workflows/RunFullGeoPipelineButton";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
import { getActiveClientForOrg } from "@/lib/context/active-client";
import { fastapiFetch } from "@/lib/fastapiClient";

export const metadata = {
  title: "Client Dashboard | GEO Command Center",
};

export default async function DashboardPage() {
  const session = await getSessionContext();

  if (!session || !session.currentOrgId) {
    // AppShell will already redirect, this is a safety guard.
    return null;
  }

  const currentOrgId = session.currentOrgId;
  const { activeClient } = await getActiveClientForOrg(currentOrgId);
  const client = activeClient ?? null;
  const activeClientId = client?.id ?? null;
  const backendProjectId = activeClientId;
  const backendOverview =
    backendProjectId == null
      ? null
      : await fastapiFetch<{
          projectGeoScore: number | null;
          projectGeoScoreCustom?: number | null;
          projectGeoScoreBenchmark?: number | null;
          benchmarkVsCustomDelta?: number | null;
          pageScoreCount: number;
          clusterScoreCount: number;
          latestComputedAt: string | null;
        }>(`/scores/overview?project_id=${encodeURIComponent(backendProjectId)}`, undefined, currentOrgId).catch(
          () => null,
        );

  const [latestMetrics] =
    activeClientId === null
      ? []
      : await db
          .select()
          .from(visibilityMetricsDaily)
          .where(eq(visibilityMetricsDaily.clientId, activeClientId))
          .orderBy(desc(visibilityMetricsDaily.date))
          .limit(1)
          .catch(() => []);

  const pendingDeliverables =
    activeClientId === null
      ? []
      : await db
          .select()
          .from(deliverables)
          .where(
            and(
              eq(deliverables.clientId, activeClientId),
              inArray(deliverables.status, [
                "in_review",
                "planned",
                "in_progress",
              ]),
            ),
          )
          .limit(5)
          .catch(() => []);

  const activeSprint =
    await db
      .select()
      .from(sprints)
      .where(inArray(sprints.status, ["active", "in_progress"]))
      .orderBy(desc(sprints.createdAt))
      .limit(1)
      .then((rows) => rows[0] ?? null)
      .catch(() => null);

  const activeTasks =
    activeSprint === null
      ? []
      : await db
          .select()
          .from(tasks)
          .where(and(eq(tasks.sprintId, activeSprint.id), ne(tasks.status, "done")))
          .limit(10)
          .catch(() => []);

  const recentAuditRows =
    activeClientId === null
      ? []
      : await db
          .select({
            id: contentAudits.id,
            score: contentAudits.score,
            auditDate: contentAudits.auditDate,
            url: pages.url,
          })
          .from(contentAudits)
          .leftJoin(pages, eq(pages.id, contentAudits.pageId))
          .where(eq(pages.clientId, activeClientId))
          .orderBy(desc(contentAudits.auditDate))
          .limit(3)
          .catch(() => []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>GEO Action Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p className="text-muted-foreground">
            End-to-end workflow: add/update a client website, run content crawl
            + audit, review entity coverage and visibility, then generate report
            deliverables.
          </p>
          <RunFullGeoPipelineButton
            projectId={activeClientId ?? undefined}
            websiteUrl={client?.websiteUrl}
            orgId={currentOrgId}
          />
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href="/admin/clients"
              className="rounded border px-2 py-1 hover:bg-muted"
            >
              1) Configure Client URL
            </Link>
            <Link
              href="/app/content-audits"
              className="rounded border px-2 py-1 hover:bg-muted"
            >
              2) Run Website Audit Crawl
            </Link>
            <Link
              href="/app/entities"
              className="rounded border px-2 py-1 hover:bg-muted"
            >
              3) Review Entity Coverage
            </Link>
            <Link
              href="/app/visibility"
              className="rounded border px-2 py-1 hover:bg-muted"
            >
              4) Measure AI Visibility
            </Link>
            <Link
              href="/app/reports"
              className="rounded border px-2 py-1 hover:bg-muted"
            >
              5) Generate Client Report
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
      {backendOverview ? (
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>GEO Scoreboard (FastAPI)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm md:grid-cols-4">
            <p>Custom GEO score: <span className="font-semibold">{backendOverview.projectGeoScoreCustom ?? backendOverview.projectGeoScore ?? "—"}</span></p>
            <p>Benchmark GEO score: <span className="font-semibold">{backendOverview.projectGeoScoreBenchmark ?? "—"}</span></p>
            <p>Benchmark Delta: <span className="font-semibold">{backendOverview.benchmarkVsCustomDelta ?? "—"}</span></p>
            <p>Page scores: <span className="font-semibold">{backendOverview.pageScoreCount}</span></p>
            <p>Cluster scores: <span className="font-semibold">{backendOverview.clusterScoreCount}</span></p>
            <p>Last computed: <span className="font-semibold">{backendOverview.latestComputedAt ? new Date(backendOverview.latestComputedAt).toLocaleString() : "—"}</span></p>
          </CardContent>
        </Card>
      ) : null}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>AI Visibility Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {latestMetrics ? (
            <>
              <p className="text-muted-foreground">
                Latest share of voice across tracked engines for{" "}
                <span className="font-medium">
                  {client?.name ?? "Current client"}
                </span>
                .
              </p>
              <div className="flex gap-6 text-xs">
                <div>
                  <div className="text-muted-foreground">Share of voice</div>
                  <div className="text-lg font-semibold">
                    {latestMetrics.shareOfVoice ?? 0}%
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Citations</div>
                  <div className="text-lg font-semibold">
                    {latestMetrics.citationCount}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Mentions</div>
                  <div className="text-lg font-semibold">
                    {latestMetrics.mentionCount}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">
              No visibility metrics yet. Once GEO runs are configured, this
              panel will show AI share-of-voice and citations for your tracked
              queries.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pending Deliverables</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {pendingDeliverables.length === 0 ? (
            <p className="text-muted-foreground">
              No deliverables awaiting review right now.
            </p>
          ) : (
            <ul className="space-y-1">
              {pendingDeliverables.map((d) => (
                <li key={d.id} className="flex items-center justify-between">
                  <span className="truncate text-xs font-medium">
                    {d.title}
                  </span>
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {d.status}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Active Sprint</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {activeSprint ? (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {activeSprint.month} sprint for {client?.name ?? "client"}
                </span>
                <Badge variant="outline" className="uppercase">
                  {activeSprint.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {activeTasks.length} open tasks in this sprint.
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">
              No active sprint detected. Once a GEO program is started for this
              client, you&apos;ll see sprint status and workload here.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>At-a-glance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-xs text-muted-foreground">
          <p>
            Org:{" "}
            <span className="font-medium text-foreground">
              {session.memberships.find(
                (m) => m.orgId === session.currentOrgId,
              )?.orgName ?? "Unknown"}
            </span>
          </p>
          <p>
            Role:{" "}
            <span className="font-medium text-foreground">
              {session.currentOrgId
                ? session.rolesByOrg[session.currentOrgId]
                : "n/a"}
            </span>
          </p>
          <p>
            Recent audits:{" "}
            <span className="font-medium text-foreground">
              {recentAuditRows.length}
            </span>
          </p>
          {recentAuditRows.length > 0 && (
            <p className="pt-1">
              <Link
                href="/app/content-audits"
                className="text-primary underline-offset-4 hover:underline"
              >
                View latest GEO findings
              </Link>
            </p>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}

