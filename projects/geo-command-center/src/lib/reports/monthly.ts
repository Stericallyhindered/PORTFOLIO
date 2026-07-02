import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import {
  clients,
  contentAudits,
  deliverables,
  pages,
  tasks,
  visibilityMetricsDaily,
  sprints,
  programs,
} from "@/db/schema";
import { buildEnterpriseAuditSummary } from "@/lib/content/enterpriseSummary";

type MonthlyReportData = {
  executiveSummary: string;
  wins: string[];
  losses: string[];
  nextMonthPlan: string[];
  visibility: {
    avgShareOfVoice: number;
    citationCount: number;
    mentionCount: number;
  };
  workCompleted: {
    completedTasks: number;
    deliverablesShipped: number;
  };
  recommendationsBacklog: string[];
  enterpriseAudit?: {
    score: number;
    confidence: number;
    auditedPages: number;
    dimensions: Array<{ id: string; score: number; status: string }>;
    topIssues: Array<{
      location: string;
      whyThisMatters: string;
      improved: string;
      implementationEffort: string;
      citationLikelihood: number;
    }>;
  };
};

export function buildMonthlyReportContent(args: {
  month: string;
  clientName: string;
  avgShareOfVoice: number;
  citationCount: number;
  mentionCount: number;
  completedTasks: number;
  deliverablesShipped: number;
  executiveSummary: string;
  enterpriseAudit?: MonthlyReportData["enterpriseAudit"];
}): MonthlyReportData {
  return {
    executiveSummary: args.executiveSummary,
    wins: [
      `AI visibility stabilized at ${args.avgShareOfVoice.toFixed(1)}% average share-of-voice.`,
      `${args.citationCount} citations captured from monitored GEO runs.`,
    ],
    losses: [
      "Entity coverage remains inconsistent across lower-authority pages.",
      "Some tracked queries still lack first-party citations.",
    ],
    nextMonthPlan: [
      "Expand entity-focused page updates for missing mention clusters.",
      "Ship schema improvements and internal link consolidation.",
      "Increase query coverage for competitive intent terms.",
    ],
    visibility: {
      avgShareOfVoice: Number(args.avgShareOfVoice.toFixed(2)),
      citationCount: args.citationCount,
      mentionCount: args.mentionCount,
    },
    workCompleted: {
      completedTasks: args.completedTasks,
      deliverablesShipped: args.deliverablesShipped,
    },
    recommendationsBacklog: [
      "Publish high-intent comparison page for core service entities.",
      "Improve FAQ schema and evidence snippets on product pages.",
      "Refresh stale top-funnel GEO pages with updated stats and citations.",
    ],
    enterpriseAudit: args.enterpriseAudit,
  };
}

async function maybeGenerateWithClaude(prompt: string): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { content?: Array<{ text?: string }> };
  return data.content?.[0]?.text ?? null;
}

export async function generateMonthlyReportData(clientId: string, month: string): Promise<MonthlyReportData> {
  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, clientId))
    .limit(1)
    .then((rows) => rows[0] ?? null);
  if (!client) {
    throw new Error("Client not found");
  }

  const visibilityRows = await db
    .select()
    .from(visibilityMetricsDaily)
    .where(eq(visibilityMetricsDaily.clientId, client.id))
    .orderBy(desc(visibilityMetricsDaily.date))
    .limit(60);

  const programRows = await db.select().from(programs).where(eq(programs.clientId, client.id));
  const programIds = new Set(programRows.map((p) => p.id));
  const sprintRows = await db.select().from(sprints).where(eq(sprints.month, month));
  const targetSprint = sprintRows.find((s) => programIds.has(s.programId));

  const sprintTasks =
    targetSprint == null
      ? []
      : await db.select().from(tasks).where(eq(tasks.sprintId, targetSprint.id));

  const monthlyDeliverables = await db
    .select()
    .from(deliverables)
    .where(eq(deliverables.clientId, client.id))
    .limit(200);

  const avgShareOfVoice =
    visibilityRows.length === 0
      ? 0
      : visibilityRows.reduce(
          (acc, row) => acc + (row.shareOfVoice ? Number(row.shareOfVoice) : 0),
          0,
        ) / visibilityRows.length;

  const citationCount = visibilityRows.reduce((acc, row) => acc + row.citationCount, 0);
  const mentionCount = visibilityRows.reduce((acc, row) => acc + row.mentionCount, 0);
  const completedTasks = sprintTasks.filter((t) => t.status === "done").length;
  const deliverablesShipped = monthlyDeliverables.filter((d) => d.status === "shipped").length;

  const clientPageIds = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.clientId, client.id))
    .then((rows) => rows.map((r) => r.id));
  const auditRows =
    clientPageIds.length === 0
      ? []
      : await db
          .select({
            score: contentAudits.score,
            issuesJson: contentAudits.issuesJson,
            recommendationsJson: contentAudits.recommendationsJson,
          })
          .from(contentAudits)
          .where(inArray(contentAudits.pageId, clientPageIds))
          .orderBy(desc(contentAudits.auditDate))
          .limit(80);
  const enterprise = buildEnterpriseAuditSummary(auditRows);

  const fallbackSummary = `In ${month}, ${client.name} averaged ${avgShareOfVoice.toFixed(
    1,
  )}% AI share-of-voice with ${citationCount} citations and ${mentionCount} mentions across tracked engines.`;

  const aiSummary =
    (await maybeGenerateWithClaude(
      `Write a concise executive summary for a GEO monthly report.\nClient: ${client.name}\nMonth: ${month}\nAvg share of voice: ${avgShareOfVoice.toFixed(
        1,
      )}%\nCitations: ${citationCount}\nMentions: ${mentionCount}\nCompleted tasks: ${completedTasks}\nDeliverables shipped: ${deliverablesShipped}`,
    )) ?? fallbackSummary;

  return buildMonthlyReportContent({
    month,
    clientName: client.name,
    avgShareOfVoice,
    citationCount,
    mentionCount,
    completedTasks,
    deliverablesShipped,
    executiveSummary: aiSummary,
    enterpriseAudit: {
      score: enterprise.score,
      confidence: enterprise.confidence,
      auditedPages: enterprise.auditedPages,
      dimensions: enterprise.dimensions,
      topIssues: enterprise.issues.slice(0, 6).map((i) => ({
        location: i.location,
        whyThisMatters: i.whyThisMatters,
        improved: i.improved,
        implementationEffort: i.implementationEffort,
        citationLikelihood: i.citationLikelihood,
      })),
    },
  });
}

