import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { brandEntities, clients, pageEntityScores, pages } from "@/db/schema";
import { crawlSite } from "@/lib/crawl/crawler";

function computeEntityScore(text: string, aliases: string[]): number {
  const lower = text.toLowerCase();
  let hits = 0;
  aliases.forEach((alias) => {
    if (lower.includes(alias.toLowerCase())) {
      hits += 1;
    }
  });
  return Math.min(100, hits * 25);
}

export async function recomputeEntityCoverageForClient(clientId: string) {
  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!client) {
    throw new Error("Client not found");
  }

  const entityRows = await db
    .select()
    .from(brandEntities)
    .where(eq(brandEntities.clientId, clientId));

  const crawled = await crawlSite({
    baseUrl: client.websiteUrl,
    maxPages: 20,
    depth: 1,
  });

  const pageRows = await db.select().from(pages).where(eq(pages.clientId, clientId));
  const pageByUrl = new Map(pageRows.map((p) => [p.url, p]));

  let writes = 0;
  for (const crawledPage of crawled) {
    const page = pageByUrl.get(crawledPage.url);
    if (!page) continue;

    const text = `${crawledPage.title} ${crawledPage.headings.join(" ")} ${crawledPage.bodyText}`;
    for (const entity of entityRows) {
      const aliases = [entity.entityName, ...(entity.aliases ?? [])];
      const score = computeEntityScore(text, aliases);
      await db.insert(pageEntityScores).values({
        pageId: page.id,
        entityId: entity.id,
        score,
        evidence: { aliasesMatched: aliases, page: crawledPage.url },
      });
      writes += 1;
    }
  }

  return { writes };
}

export async function getEntityCoverageSummaryForClient(clientId: string) {
  const entities = await db
    .select()
    .from(brandEntities)
    .where(eq(brandEntities.clientId, clientId));

  const scores = await db.select().from(pageEntityScores);
  const pageRows = await db.select().from(pages).where(eq(pages.clientId, clientId));
  const pageIds = new Set(pageRows.map((p) => p.id));
  const filteredScores = scores.filter((s) => pageIds.has(s.pageId));

  return entities.map((entity) => {
    const entityScores = filteredScores.filter((s) => s.entityId === entity.id);
    const avg =
      entityScores.length === 0
        ? 0
        : entityScores.reduce((acc, curr) => acc + curr.score, 0) / entityScores.length;

    return {
      entityId: entity.id,
      entityName: entity.entityName,
      averageCoverageScore: Number(avg.toFixed(1)),
      sampledPages: entityScores.length,
    };
  });
}

