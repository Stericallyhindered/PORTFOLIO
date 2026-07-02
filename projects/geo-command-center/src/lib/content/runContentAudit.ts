import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import {
  brandEntities,
  clients,
  contentAudits,
  pages,
} from "@/db/schema";
import { crawlSite } from "@/lib/crawl/crawler";
import { runPageAudit } from "./audit";

export async function runContentAuditForClient(clientId: string) {
  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!client) {
    throw new Error("Client not found");
  }

  const entities = await db
    .select()
    .from(brandEntities)
    .where(eq(brandEntities.clientId, client.id));

  const crawled = await crawlSite({
    baseUrl: client.websiteUrl,
    maxPages: 20,
    depth: 1,
  });
  const runAt = new Date();
  const runKey = `${client.id}/${runAt.toISOString()}`;
  const startedAt = Date.now();
  let failedPages = 0;
  const previousPageIds = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.clientId, client.id))
    .then((rows) => rows.map((r) => r.id));
  const previousScores =
    previousPageIds.length === 0
      ? []
      : await db
          .select({ score: contentAudits.score })
          .from(contentAudits)
          .where(inArray(contentAudits.pageId, previousPageIds))
          .orderBy(desc(contentAudits.auditDate))
          .limit(80);
  const pageSummaries: Array<{
    pageId: string;
    url: string;
    score: number;
    confidence: number;
    dimensions: unknown;
  }> = [];

  for (const page of crawled) {
    try {
      const existingPage = await db
        .select()
        .from(pages)
        .where(and(eq(pages.clientId, client.id), eq(pages.url, page.url)))
        .limit(1)
        .then((rows) => rows[0] ?? null);

      const pageRow =
        existingPage ??
        (
          await db
            .insert(pages)
            .values({
              clientId: client.id,
              orgId: client.orgId,
              url: page.url,
              pageType: "web",
              topicCluster: null,
              status: "active",
            })
            .returning()
        )[0];

      const audit = await runPageAudit(
        page,
        entities.map((e) => e.entityName),
      );
      const currentVsImproved = audit.issues.slice(0, 8).map((issue) => ({
        code: issue.code,
        location: issue.location,
        whyThisMatters: issue.whyThisMatters,
        current: issue.current,
        improved: issue.improved,
        implementationEffort: issue.implementationEffort,
        citationLikelihood: issue.citationLikelihood,
        dimension: issue.dimension,
      }));

      await db.insert(contentAudits).values({
        pageId: pageRow.id,
        auditDate: runAt,
        issuesJson: {
          frameworkVersion: audit.frameworkVersion,
          confidence: audit.confidence,
          dimensions: audit.dimensions,
          issues: audit.issues,
          currentVsImproved,
        },
        recommendationsJson: {
          recommendations: audit.recommendations,
          engineEvidence: audit.engineEvidence,
          schemaSuggestions: audit.schemaSuggestions,
          geoAiOptimizations: audit.geoAiOptimizations,
        },
        score: audit.score,
        frameworkVersion: audit.frameworkVersion,
        runConfidence: Math.round(audit.confidence * 100),
        dimensionScoresJson: audit.dimensions.map((d) => ({
          id: d.id,
          score: d.score,
          weight: d.weight,
          status: d.status,
          summary: d.summary,
        })),
        subDimensionScoresJson: audit.dimensions.map((d) => ({
          id: d.id,
          subDimensions: d.subDimensions,
        })),
        engineEvidenceJson: audit.engineEvidence,
        modelJudgmentJson: {
          score: audit.score,
          confidence: audit.confidence,
          geoAiOptimizations: audit.geoAiOptimizations,
        },
        currentVsImprovedJson: currentVsImproved,
      });

      pageSummaries.push({
        pageId: pageRow.id,
        url: page.url,
        score: audit.score,
        confidence: audit.confidence,
        dimensions: audit.dimensions,
      });
    } catch {
      failedPages += 1;
    }
  }

  return {
    auditedPages: crawled.length,
    successfulPages: pageSummaries.length,
    failedPages,
    durationMs: Date.now() - startedAt,
    auditRunAt: runAt.toISOString(),
    auditFolderKey: runKey,
    frameworkVersion: "enterprise-llm-v1",
    pageSummaries,
    telemetry: {
      averageScore:
        pageSummaries.length === 0
          ? 0
          : Number(
              (
                pageSummaries.reduce((acc, p) => acc + p.score, 0) / pageSummaries.length
              ).toFixed(2),
            ),
      previousAverageScore:
        previousScores.length === 0
          ? null
          : Number(
              (
                previousScores.reduce((acc, p) => acc + (p.score ?? 0), 0) /
                previousScores.length
              ).toFixed(2),
            ),
      varianceAlert:
        previousScores.length === 0
          ? false
          : Math.abs(
                (pageSummaries.reduce((acc, p) => acc + p.score, 0) /
                  Math.max(1, pageSummaries.length)) -
                  previousScores.reduce((acc, p) => acc + (p.score ?? 0), 0) /
                    previousScores.length,
              ) > 25,
    },
  };
}

