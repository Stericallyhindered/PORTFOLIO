import { NextResponse } from "next/server";
import { inArray } from "drizzle-orm";

import { getSessionContext } from "@/lib/auth/session";
import { db } from "@/db/client";
import { citations, engineRuns, trackedQueries } from "@/db/schema";

export async function GET() {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const queries = await db.select().from(trackedQueries);
  const queryIds = queries
    .filter((q) => q.orgId === session.currentOrgId)
    .map((q) => q.id);

  if (queryIds.length === 0) {
    return new NextResponse("id,engine_run_id,cited_domain,cited_url,snippet,rank\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "attachment; filename=citations.csv",
      },
    });
  }

  const runs = await db.select().from(engineRuns).where(inArray(engineRuns.trackedQueryId, queryIds));
  const runIds = runs.map((r) => r.id);
  const rows =
    runIds.length === 0
      ? []
      : await db.select().from(citations).where(inArray(citations.engineRunId, runIds));

  const header = ["id", "engine_run_id", "cited_domain", "cited_url", "snippet", "rank"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.id, r.engineRunId, r.citedDomain, r.citedUrl, r.snippet, r.rank]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=citations.csv",
    },
  });
}

