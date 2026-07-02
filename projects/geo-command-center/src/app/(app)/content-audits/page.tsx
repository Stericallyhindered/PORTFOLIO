import { db } from "@/db/client";
import { contentAudits, pages, clients, deliverables } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { DataTable } from "@/components/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { OneClickGeoPanel } from "@/components/workflows/OneClickGeoPanel";
import { DeleteGeoPackageButton } from "@/components/content-audits/DeleteGeoPackageButton";
import { ClearAuditFindingsButton } from "@/components/content-audits/ClearAuditFindingsButton";
import { LatestAuditFindingsPanel } from "@/components/content-audits/LatestAuditFindingsPanel";
import { PurgeBlendedHistoryButton } from "@/components/content-audits/PurgeBlendedHistoryButton";
import { GeneratePromptPackButton } from "@/components/content-audits/GeneratePromptPackButton";
import { getActiveClientForOrg } from "@/lib/context/active-client";
import { ResetWorkspaceDataButton } from "@/components/admin/ResetWorkspaceDataButton";
import { fastapiFetch } from "@/lib/fastapiClient";

type AuditRow = {
  id: string;
  url: string;
  score: string;
  auditDate: string;
};

type AuditInsight = {
  id: string;
  url: string;
  score: number | null;
  auditDate: string;
  runId?: string | null;
  issues: string[];
  recommendations: string[];
  dimensions?: Array<{ id: string; score: number; status: string }>;
  confidence?: number;
  currentVsImproved?: Array<{
    location: string;
    whyThisMatters: string;
    current: string;
    improved: string;
    implementationEffort: string;
    citationLikelihood: number;
    dimension: string;
  }>;
  engineEvidence?: Array<{
    engine: string;
    score: number;
    confidence: number;
    summary: string;
  }>;
  schemaSuggestions?: Array<{
    targetUrl: string;
    recommendedNodes: string[];
    insertionPoint: string;
    why: string;
  }>;
  geoAiOptimizations?: Array<{
    category: string;
    priority: string;
    action: string;
    whyItImprovesAiDiscovery: string;
  }>;
};

export const metadata = {
  title: "Content Audits | GEO Command Center",
};

type Props = {
  searchParams?: Promise<{ folder?: string; website?: string }>;
};

export default async function ContentAuditsPage({ searchParams }: Props) {
  const params = (await searchParams) ?? {};
  const selectedFolder = params.folder ?? null;
  const selectedWebsite = params.website ?? null;
  const session = await getSessionContext();

  if (!session || !session.currentOrgId) {
    return null;
  }

  const { orgClients, activeClient } = await getActiveClientForOrg(session.currentOrgId);
  const selectedClient =
    (selectedWebsite
      ? orgClients.find((client) => client.websiteUrl === selectedWebsite)
      : null) ?? activeClient ?? null;
  const backendProjectId = selectedClient?.id ?? null;
  const activeWebsiteUrl = selectedClient?.websiteUrl;

  if (!backendProjectId) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Content Audits</h1>
          <p className="text-sm text-muted-foreground">
            No active website selected. Configure a client website first, then run the full GEO pipeline.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/clients"
            className="inline-flex h-9 items-center rounded-md border px-3 text-xs hover:bg-muted"
          >
            Configure Client Website
          </Link>
          <ResetWorkspaceDataButton />
        </div>
      </div>
    );
  }

  const backendOverview =
    await fastapiFetch<{
          websites: Array<{ id: string; websiteUrl: string; name: string }>;
          activeProjectId: string | null;
          folders: Array<{ folderDate: string; count: number; runId: string; status: string }>;
          insights: AuditInsight[];
          packages: Array<{
            id: string;
            title: string;
            createdAt: string;
            status: string;
            storagePath: string;
          }>;
          promptPacks: Array<{ id: string; createdAt: string; storagePath: string }>;
        }>(
      `/reports/content-audits-overview?project_id=${encodeURIComponent(backendProjectId)}${
        selectedFolder ? `&run_id=${encodeURIComponent(selectedFolder)}` : ""
      }`,
      undefined,
      session.currentOrgId,
    ).catch(() => null);

  if (backendOverview) {
    const insights = backendOverview.insights ?? [];
    const folders = backendOverview.folders ?? [];
    const packageRows = backendOverview.packages ?? [];
    const promptPacks = backendOverview.promptPacks ?? [];
    const backendApiBase = (process.env.NEXT_PUBLIC_BACKEND_API_URL ?? "http://localhost:8000/api/v1").replace(/\/$/, "");
    const promptPackBySourcePackageId = new Map<string, { id: string }>(
      packageRows.map((pkg) => {
        const pack = promptPacks.find((p) => p.id === pkg.id) ?? promptPacks[0];
        return [pkg.id, { id: pack?.id ?? "" }];
      }),
    );
    const data: AuditRow[] = insights.map((r) => ({
      id: r.id,
      url: r.url,
      score: r.score == null ? "—" : String(r.score),
      auditDate: new Date(r.auditDate).toLocaleDateString(),
    }));
    const filteredInsights =
      selectedFolder == null
        ? insights.slice(0, 8)
        : insights.filter((i) => i.runId === selectedFolder);
    const columns: ColumnDef<AuditRow>[] = [
      { accessorKey: "url", header: "Page" },
      { accessorKey: "score", header: "Score" },
      { accessorKey: "auditDate", header: "Last Audit" },
    ];

    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Content Audits</h1>
          <p className="text-sm text-muted-foreground">
            FastAPI-backed GEO audit workspace aligned to multi-engine GEO_PROMPT rules.
          </p>
        </div>
        <OneClickGeoPanel
          defaultWebsiteUrl={activeWebsiteUrl ?? backendOverview.websites[0]?.websiteUrl}
          defaultProjectId={backendOverview.activeProjectId ?? undefined}
          orgId={session.currentOrgId}
        />
        <div className="flex flex-wrap gap-2">
          <ClearAuditFindingsButton
            projectId={backendOverview.activeProjectId ?? undefined}
            orgId={session.currentOrgId}
          />
          <PurgeBlendedHistoryButton
            projectId={backendOverview.activeProjectId ?? undefined}
            websiteUrl={activeWebsiteUrl ?? backendOverview.websites[0]?.websiteUrl}
            orgId={session.currentOrgId}
          />
          <ResetWorkspaceDataButton />
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Websites</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            {backendOverview.websites.map((w) => (
              <span key={w.id} className="rounded border px-2 py-1">
                {w.websiteUrl}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Audit Folders (Pipeline Runs)</h2>
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href={
                selectedWebsite
                  ? `/app/content-audits?website=${encodeURIComponent(selectedWebsite)}`
                  : "/app/content-audits"
              }
              className={`rounded border px-2 py-1 hover:bg-muted ${
                selectedFolder == null ? "bg-muted" : ""
              }`}
            >
              Latest
            </Link>
            {folders.map((folder) => (
              (() => {
                const base = selectedWebsite
                  ? `/app/content-audits?website=${encodeURIComponent(selectedWebsite)}`
                  : "/app/content-audits";
                const href = `${base}${base.includes("?") ? "&" : "?"}folder=${encodeURIComponent(folder.runId)}`;
                return (
              <Link
                key={folder.runId}
                href={href}
                className={`rounded border px-2 py-1 hover:bg-muted ${
                  selectedFolder === folder.runId ? "bg-muted" : ""
                }`}
              >
                {new Date(folder.folderDate).toLocaleString()} ({folder.status})
              </Link>
                );
              })()
            ))}
          </div>
        </div>
        <DataTable columns={columns} data={data} />
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Generated GEO Packages</h2>
          {packageRows.length === 0 ? (
            <p className="text-xs text-muted-foreground">No packages yet.</p>
          ) : (
            <div className="space-y-1 text-xs">
              {packageRows.map((pkg) => (
                <div
                  key={pkg.id}
                  className="flex items-center justify-between rounded border px-2 py-1"
                >
                  <div>
                    <p className="font-medium">{pkg.title}</p>
                    <p className="text-muted-foreground">
                      {new Date(pkg.createdAt).toLocaleString()} · {pkg.status}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <GeneratePromptPackButton
                      geoPackageId={pkg.id}
                      projectId={backendOverview.activeProjectId ?? undefined}
                      orgId={session.currentOrgId}
                    />
                    {promptPackBySourcePackageId.get(pkg.id)?.id ? (
                      <a
                        href={`${backendApiBase}/reports/${promptPackBySourcePackageId.get(pkg.id)!.id}/download`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        Download Prompt Pack JSON
                      </a>
                    ) : null}
                    <DeleteGeoPackageButton packageId={pkg.id} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <h2 className="text-sm font-medium">Latest Audit Findings</h2>
          <LatestAuditFindingsPanel
            insights={filteredInsights}
            projectId={backendOverview.activeProjectId ?? undefined}
            orgId={session.currentOrgId}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">Content Audits</h1>
        <p className="text-sm text-muted-foreground">
          Unable to load audit overview right now. Refresh the page after backend reconnects.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <ResetWorkspaceDataButton />
      </div>
    </div>
  );

  const client =
    (selectedWebsite
      ? orgClients.find((c) => c.websiteUrl === selectedWebsite)
      : null) ?? activeClient ?? null;

  const pageRows =
    client == null
      ? []
      : await db
          .select()
          .from(pages)
          .where(eq(pages.clientId, client.id))
          .limit(1000);
  const pageById = new Map(pageRows.map((p) => [p.id, p.url]));
  const pageIds = pageRows.map((p) => p.id);

  const rows =
    pageIds.length === 0
      ? []
      : await db
          .select({
            id: contentAudits.id,
            pageId: contentAudits.pageId,
            score: contentAudits.score,
            auditDate: contentAudits.auditDate,
            issuesJson: contentAudits.issuesJson,
            recommendationsJson: contentAudits.recommendationsJson,
          })
          .from(contentAudits)
          .where(inArray(contentAudits.pageId, pageIds))
          .orderBy(desc(contentAudits.auditDate))
          .limit(500);

  const packageRows =
    client == null
      ? []
      : await db
          .select({
            id: deliverables.id,
            title: deliverables.title,
            createdAt: deliverables.createdAt,
            status: deliverables.status,
          })
          .from(deliverables)
          .where(
            and(
              eq(deliverables.clientId, client.id),
              eq(deliverables.type, "schema_update"),
            ),
          )
          .orderBy(desc(deliverables.createdAt))
          .limit(8);

  const promptPackRows =
    client == null
      ? []
      : await db
          .select({
            id: deliverables.id,
            createdAt: deliverables.createdAt,
            contentJson: deliverables.contentJson,
          })
          .from(deliverables)
          .where(eq(deliverables.clientId, client.id))
          .orderBy(desc(deliverables.createdAt))
          .limit(200);

  const promptPackBySourcePackageId = new Map<string, { id: string }>();
  promptPackRows.forEach((row) => {
    const content = (row.contentJson ?? {}) as Record<string, unknown>;
    if (content.kind !== "geo_page_prompt_pack") {
      return;
    }
    const sourcePackageId = content.sourcePackageId;
    if (typeof sourcePackageId !== "string" || sourcePackageId.length === 0) {
      return;
    }
    if (!promptPackBySourcePackageId.has(sourcePackageId)) {
      promptPackBySourcePackageId.set(sourcePackageId, { id: row.id });
    }
  });

  const data: AuditRow[] = rows.map((r) => ({
    id: r.id,
    url: pageById.get(r.pageId) ?? "Page",
    score: r.score == null ? "—" : String(r.score),
    auditDate: new Date(r.auditDate).toLocaleDateString(),
  }));

  function extractMessages(
    source: unknown,
    key: "message" | "action",
    limit = 3,
  ): string[] {
    const list = Array.isArray(source)
      ? source
      : Array.isArray((source as Record<string, unknown> | null)?.issues) && key === "message"
        ? (((source as Record<string, unknown>).issues as unknown[]) ?? [])
        : Array.isArray((source as Record<string, unknown> | null)?.recommendations) &&
            key === "action"
          ? (((source as Record<string, unknown>).recommendations as unknown[]) ?? [])
          : [];
    return list
      .map((item) => {
        if (!item || typeof item !== "object") {
          return null;
        }
        const value = (item as Record<string, unknown>)[key];
        return typeof value === "string" && value.trim().length > 0
          ? value.trim()
          : null;
      })
      .filter((v): v is string => Boolean(v))
      .slice(0, limit);
  }

  function readObjectArray(source: unknown, key: string) {
    if (!source || typeof source !== "object") return [];
    const value = (source as Record<string, unknown>)[key];
    return Array.isArray(value)
      ? value.filter((x): x is Record<string, unknown> => typeof x === "object" && x !== null)
      : [];
  }

  const latestInsights: AuditInsight[] = rows
    .map((r) => ({
      id: r.id,
      url: pageById.get(r.pageId) ?? "Page",
      score: r.score,
      auditDate: new Date(r.auditDate).toISOString(),
      issues: extractMessages(r.issuesJson, "message"),
      recommendations: extractMessages(r.recommendationsJson, "action"),
      confidence:
        typeof (r.issuesJson as Record<string, unknown> | null)?.confidence === "number"
          ? ((r.issuesJson as Record<string, unknown>).confidence as number)
          : undefined,
      dimensions: readObjectArray(r.issuesJson, "dimensions").map((d) => ({
        id: String(d.id ?? "unknown"),
        score: Number(d.score ?? 0),
        status: String(d.status ?? "unknown"),
      })),
      currentVsImproved: readObjectArray(r.issuesJson, "currentVsImproved").map((item) => ({
        location: String(item.location ?? "Unknown section"),
        whyThisMatters: String(item.whyThisMatters ?? ""),
        current: String(item.current ?? ""),
        improved: String(item.improved ?? ""),
        implementationEffort: String(item.implementationEffort ?? "medium"),
        citationLikelihood: Number(item.citationLikelihood ?? 0),
        dimension: String(item.dimension ?? "general"),
      })),
      engineEvidence: readObjectArray(r.recommendationsJson, "engineEvidence").map((e) => ({
        engine: String(e.engine ?? "unknown"),
        score: Number(e.score ?? 0),
        confidence: Number(e.confidence ?? 0),
        summary: String(e.summary ?? ""),
      })),
      schemaSuggestions: readObjectArray(r.recommendationsJson, "schemaSuggestions").map((s) => ({
        targetUrl: String(s.targetUrl ?? ""),
        recommendedNodes: Array.isArray(s.recommendedNodes)
          ? (s.recommendedNodes as unknown[]).map((n) => String(n))
          : [],
        insertionPoint: String(s.insertionPoint ?? ""),
        why: String(s.why ?? ""),
      })),
      geoAiOptimizations: readObjectArray(r.recommendationsJson, "geoAiOptimizations").map((g) => ({
        category: String(g.category ?? "general"),
        priority: String(g.priority ?? "p2"),
        action: String(g.action ?? ""),
        whyItImprovesAiDiscovery: String(g.whyItImprovesAiDiscovery ?? ""),
      })),
    }))
    .sort((a, b) => new Date(b.auditDate).getTime() - new Date(a.auditDate).getTime())
    .slice(0, 100);

  const folders = [...new Set(latestInsights.map((i) => i.auditDate))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .map((folderDate) => {
      const runItems = latestInsights.filter((i) => i.auditDate === folderDate);
      return {
        folderDate,
        count: runItems.length,
      };
    });

  const filteredInsights =
    selectedFolder == null
      ? latestInsights.slice(0, 8)
      : latestInsights.filter((i) => i.auditDate === selectedFolder);

  const columns: ColumnDef<AuditRow>[] = [
    {
      accessorKey: "url",
      header: "Page",
    },
    {
      accessorKey: "score",
      header: "Score",
    },
    {
      accessorKey: "auditDate",
      header: "Last Audit",
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Content Audits
        </h1>
        <p className="text-sm text-muted-foreground">
          Track audit scores, freshness, schema coverage, and entity coverage
          across your key GEO pages.
        </p>
      </div>
      <OneClickGeoPanel
        defaultWebsiteUrl={client?.websiteUrl}
        defaultProjectId={client?.id}
        orgId={session.currentOrgId}
      />
      <div className="flex flex-wrap gap-2">
        <ClearAuditFindingsButton
          projectId={client?.id}
          orgId={session.currentOrgId}
        />
        <PurgeBlendedHistoryButton
          projectId={client?.id}
          websiteUrl={client?.websiteUrl}
          orgId={session.currentOrgId}
        />
        {client?.id ? (
          <>
            <Link
              href={`/api/content-audits/export?clientId=${client.id}${
                selectedFolder ? `&folder=${encodeURIComponent(selectedFolder)}` : ""
              }&format=json`}
              className="inline-flex h-9 items-center rounded-md border px-3 text-xs hover:bg-muted"
            >
              Download Enterprise Audit JSON
            </Link>
            <Link
              href={`/api/content-audits/export?clientId=${client.id}${
                selectedFolder ? `&folder=${encodeURIComponent(selectedFolder)}` : ""
              }&format=pdf`}
              className="inline-flex h-9 items-center rounded-md border px-3 text-xs hover:bg-muted"
            >
              Download Enterprise Audit PDF
            </Link>
          </>
        ) : null}
        <ResetWorkspaceDataButton />
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-medium">Websites</h2>
        {orgClients.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No websites yet. Enter one in One-Click GEO Engine.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 text-xs">
            {orgClients.map((c) => (
              <Link
                key={c.id}
                href={`/app/content-audits?website=${encodeURIComponent(c.websiteUrl)}`}
                className={`rounded border px-2 py-1 hover:bg-muted ${
                  client?.id === c.id ? "bg-muted" : ""
                }`}
              >
                {c.websiteUrl}
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-medium">Audit Folders (Pipeline Runs)</h2>
        {folders.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No runs yet. Each run creates a folder-style batch.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 text-xs">
            <Link
              href={
                client?.websiteUrl
                  ? `/app/content-audits?website=${encodeURIComponent(client.websiteUrl)}`
                  : "/app/content-audits"
              }
              className={`rounded border px-2 py-1 hover:bg-muted ${
                selectedFolder == null ? "bg-muted" : ""
              }`}
            >
              Latest
            </Link>
            {folders.slice(0, 12).map((folder) => (
              <Link
                key={folder.folderDate}
                href={`/app/content-audits?website=${encodeURIComponent(
                  client?.websiteUrl ?? "",
                )}&folder=${encodeURIComponent(folder.folderDate)}`}
                className={`rounded border px-2 py-1 hover:bg-muted ${
                  selectedFolder === folder.folderDate ? "bg-muted" : ""
                }`}
              >
                {new Date(folder.folderDate).toLocaleString()} ({folder.count})
              </Link>
            ))}
          </div>
        )}
      </div>
      <DataTable columns={columns} data={data} />
      <div className="space-y-2">
        <h2 className="text-sm font-medium">Generated GEO Packages</h2>
        {packageRows.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No packages yet. Run crawl/audit, then click Generate GEO Package.
          </p>
        ) : (
          <div className="space-y-1 text-xs">
            {packageRows.map((pkg) => (
              <div
                key={pkg.id}
                className="flex items-center justify-between rounded border px-2 py-1"
              >
                <div>
                  <p className="font-medium">{pkg.title}</p>
                  <p className="text-muted-foreground">
                    {new Date(pkg.createdAt).toLocaleString()} · {pkg.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/app/reports/${pkg.id}`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    View
                  </Link>
                  <Link
                    href={`/api/geo-packages/${pkg.id}/download`}
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Download JSON
                  </Link>
                  {promptPackBySourcePackageId.get(pkg.id) ? (
                    <Link
                      href={`/api/prompt-packs/${promptPackBySourcePackageId.get(pkg.id)!.id}/download`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      Download Prompt Pack JSON
                    </Link>
                  ) : null}
                  <GeneratePromptPackButton
                    geoPackageId={pkg.id}
                    projectId={client?.id}
                    orgId={session.currentOrgId}
                  />
                  <DeleteGeoPackageButton packageId={pkg.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h2 className="text-sm font-medium">Latest Audit Findings</h2>
        <LatestAuditFindingsPanel
          insights={filteredInsights}
          projectId={client?.id}
          orgId={session.currentOrgId}
        />
      </div>
    </div>
  );
}

