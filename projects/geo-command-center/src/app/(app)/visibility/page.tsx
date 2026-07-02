import { getSessionContext } from "@/lib/auth/session";
import { DataTable } from "@/components/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { AggregateVisibilityButton } from "@/components/visibility/AggregateVisibilityButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getActiveClientForOrg } from "@/lib/context/active-client";
import { fastapiFetch } from "@/lib/fastapiClient";

type VisibilityRow = {
  id: string;
  date: string;
  engine: string;
  client: string;
  shareOfVoice: string;
  citationCount: number;
  mentionCount: number;
};

const ENGINE_ORDER = [
  "chatgpt",
  "google-ai-overviews",
  "perplexity",
  "gemini",
  "claude",
] as const;

export const metadata = {
  title: "Visibility | GEO Command Center",
};

export default async function VisibilityPage() {
  const session = await getSessionContext();

  if (!session || !session.currentOrgId) {
    return null;
  }

  const { activeClient } = await getActiveClientForOrg(session.currentOrgId);
  const projectId = activeClient?.id;
  const backendOverview = await fastapiFetch<{
    visibility: Array<{ engine: string; mentions: number; citations: number; rows: number }>;
  }>(
    projectId
      ? `/reports/org-overview?project_id=${encodeURIComponent(projectId)}`
      : "/reports/org-overview",
    undefined,
    session.currentOrgId,
  ).catch(() => null);

  const totalMentions = (backendOverview?.visibility ?? []).reduce(
    (sum, item) => sum + Math.max(item.mentions, 0),
    0,
  );

  const data: VisibilityRow[] = (backendOverview?.visibility ?? []).map(
    (item, index) => ({
      id: `${item.engine}-${index}`,
      date: new Date().toISOString(),
      engine: item.engine,
      client: activeClient?.name ?? "Org",
      shareOfVoice:
        totalMentions === 0
          ? "—"
          : `${((item.mentions / totalMentions) * 100).toFixed(1)}%`,
      citationCount: item.citations,
      mentionCount: item.mentions,
    }),
  );

  const columns: ColumnDef<VisibilityRow>[] = [
    {
      accessorKey: "date",
      header: "Date",
    },
    {
      accessorKey: "engine",
      header: "Engine",
    },
    {
      accessorKey: "client",
      header: "Client",
    },
    {
      accessorKey: "shareOfVoice",
      header: "Share of Voice",
    },
    {
      accessorKey: "citationCount",
      header: "Citations",
    },
    {
      accessorKey: "mentionCount",
      header: "Mentions",
    },
  ];

  const byEngine = new Map<
    string,
    { rows: number; citations: number; mentions: number; shareTotal: number; shareCount: number }
  >();

  data.forEach((row) => {
    const current = byEngine.get(row.engine) ?? {
      rows: 0,
      citations: 0,
      mentions: 0,
      shareTotal: 0,
      shareCount: 0,
    };
    current.rows += 1;
    current.citations += row.citationCount;
    current.mentions += row.mentionCount;
    if (row.shareOfVoice !== "—") {
      current.shareTotal += Number.parseFloat(row.shareOfVoice.replace("%", ""));
      current.shareCount += 1;
    }
    byEngine.set(row.engine, current);
  });

  const cardEngines = ENGINE_ORDER.map((engine) => [
    engine,
    byEngine.get(engine) ?? {
      rows: 0,
      citations: 0,
      mentions: 0,
      shareTotal: 0,
      shareCount: 0,
    },
  ] as const);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">
            AI Visibility by Engine
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore share-of-voice, citation volume, and mentions across
            engines for the active website. Visibility refresh uses the latest
            engine runs from the full GEO pipeline.
          </p>
        </div>
        <AggregateVisibilityButton
          projectId={activeClient?.id}
          orgId={session.currentOrgId}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
        {cardEngines.map(([engine, summary]) => (
          <Card key={engine}>
            <CardHeader>
              <CardTitle className="text-sm">{engine}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs">
              <p>Rows: {summary.rows}</p>
              <p>Citations: {summary.citations}</p>
              <p>Mentions: {summary.mentions}</p>
              <p>
                Avg share:{" "}
                {summary.shareCount === 0
                  ? "—"
                  : `${(summary.shareTotal / summary.shareCount).toFixed(1)}%`}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Visibility Data Table
        </h1>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}

