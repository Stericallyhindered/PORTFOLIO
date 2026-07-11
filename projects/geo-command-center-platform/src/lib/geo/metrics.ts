import { and, gte, inArray, lt } from "drizzle-orm";

import { db } from "@/db/client";
import {
  citations,
  engineRuns,
  trackedQueries,
  visibilityMetricsDaily,
} from "@/db/schema";

function dayBounds(target: Date) {
  const start = new Date(target);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function aggregateVisibilityMetricsForDay(target: Date) {
  const { start, end } = dayBounds(target);

  const runs = await db
    .select()
    .from(engineRuns)
    .where(and(gte(engineRuns.runTime, start), lt(engineRuns.runTime, end)));

  if (runs.length === 0) {
    return 0;
  }

  const queryIds = Array.from(new Set(runs.map((r) => r.trackedQueryId)));
  const queries = await db.select().from(trackedQueries);
  const queryById = new Map(
    queries
      .filter((q) => queryIds.includes(q.id))
      .map((q) => [q.id, { clientId: q.clientId, orgId: q.orgId }]),
  );

  const runIds = runs.map((r) => r.id);
  const runCitations =
    runIds.length === 0
      ? []
      : await db.select().from(citations).where(inArray(citations.engineRunId, runIds));

  const grouped = new Map<
    string,
    {
      orgId: string;
      clientId: string;
      engineId: string;
      mentionCount: number;
      citationCount: number;
      totalPositionWeight: number;
      positionWeightCount: number;
      runCount: number;
    }
  >();

  runs.forEach((run) => {
    const query = queryById.get(run.trackedQueryId);
    if (!query) {
      return;
    }
    const key = `${query.orgId}:${query.clientId}:${run.engineId}`;
    const current =
      grouped.get(key) ?? {
        orgId: query.orgId,
        clientId: query.clientId,
        engineId: run.engineId,
        mentionCount: 0,
        citationCount: 0,
        totalPositionWeight: 0,
        positionWeightCount: 0,
        runCount: 0,
      };

    current.runCount += 1;
    current.mentionCount += (run.mentionedBrands as string[] | null)?.length ?? 0;
    grouped.set(key, current);
  });

  runCitations.forEach((c) => {
    const run = runs.find((r) => r.id === c.engineRunId);
    if (!run) {
      return;
    }
    const query = queryById.get(run.trackedQueryId);
    if (!query) {
      return;
    }
    const key = `${query.orgId}:${query.clientId}:${run.engineId}`;
    const current = grouped.get(key);
    if (!current) {
      return;
    }
    current.citationCount += 1;
    if (c.positionWeight != null) {
      current.totalPositionWeight += Number.parseFloat(String(c.positionWeight));
      current.positionWeightCount += 1;
    }
  });

  let upserts = 0;
  for (const value of grouped.values()) {
    await db.insert(visibilityMetricsDaily).values({
      orgId: value.orgId,
      clientId: value.clientId,
      engineId: value.engineId,
      date: start.toISOString().slice(0, 10),
      shareOfVoice: value.runCount === 0 ? "0" : String((value.mentionCount / value.runCount) * 100),
      citationCount: value.citationCount,
      mentionCount: value.mentionCount,
      avgPositionWeight:
        value.positionWeightCount === 0
          ? null
          : String(value.totalPositionWeight / value.positionWeightCount),
      competitorShareJson: {},
    });
    upserts += 1;
  }

  return upserts;
}

