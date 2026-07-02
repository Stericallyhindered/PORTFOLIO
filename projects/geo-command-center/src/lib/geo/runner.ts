import { and, desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  aiEngines,
  brandEntities,
  citations,
  clients,
  competitorEntities,
  engineRuns,
  trackedQueries,
} from "@/db/schema";
import { resolveEngineConnector } from "./engines";
import { classifyCitationMentions } from "./parser";

export async function runTrackedQuery(trackedQueryId: string, engineSlug: string) {
  const queryRow = await db
    .select()
    .from(trackedQueries)
    .where(eq(trackedQueries.id, trackedQueryId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!queryRow) {
    throw new Error(`Tracked query not found: ${trackedQueryId}`);
  }

  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, queryRow.clientId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!client) {
    throw new Error(`Client not found for query ${trackedQueryId}`);
  }

  const engine = await db
    .select()
    .from(aiEngines)
    .where(eq(aiEngines.slug, engineSlug))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!engine) {
    throw new Error(`Engine not found: ${engineSlug}`);
  }

  const entities = await db
    .select()
    .from(brandEntities)
    .where(eq(brandEntities.clientId, client.id))
    .orderBy(desc(brandEntities.createdAt));
  const competitors = await db
    .select()
    .from(competitorEntities)
    .where(eq(competitorEntities.clientId, client.id))
    .orderBy(desc(competitorEntities.createdAt));

  const connector = resolveEngineConnector(engine.slug);
  const startedAt = Date.now();
  const result = await connector.runQuery({
    query: queryRow.queryText,
    region: queryRow.region,
    language: queryRow.language,
    entities: entities.map((e) => e.entityName),
    brandDomains: [client.websiteUrl],
  });
  const classifiedCitations = classifyCitationMentions({
    citations: result.citations,
    brandDomains: [client.websiteUrl],
    competitorDomains: competitors
      .map((c) => c.canonicalUrl ?? c.entityName)
      .filter((v): v is string => Boolean(v)),
  });
  const durationMs = Date.now() - startedAt;

  const [run] = await db
    .insert(engineRuns)
    .values({
      trackedQueryId: queryRow.id,
      engineId: engine.id,
      runTime: new Date(),
      rawResponse: result.raw,
      citationsJson: classifiedCitations,
      mentionedBrands: result.mentionedBrands,
      confidence: String(result.confidence),
      durationMs,
      status: "completed",
    })
    .returning();

  if (classifiedCitations.length > 0) {
    await db.insert(citations).values(
      classifiedCitations.map((c) => ({
        engineRunId: run.id,
        citedDomain: c.citedDomain,
        citedUrl: c.citedUrl,
        mentionType: c.mentionType ?? "neutral",
        snippet: c.snippet ?? null,
        rank: c.rank ?? null,
        confidence: c.confidence == null ? null : String(c.confidence),
        positionWeight:
          c.positionWeight == null ? null : String(c.positionWeight),
      })),
    );
  }

  return run;
}

export async function runActiveQueriesForEngine(engineSlug: string) {
  const queries = await db
    .select()
    .from(trackedQueries)
    .where(and(eq(trackedQueries.active, 1)));

  const runs = [];
  for (const query of queries) {
    const run = await runTrackedQuery(query.id, engineSlug);
    runs.push(run);
  }

  return runs;
}

