import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clients, deliverables } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { renderMonthlyReportPdf } from "@/lib/reports/pdf";

type RouteContext = {
  params: Promise<{ id: string }>;
};

type VisibilityContent = {
  avgShareOfVoice?: unknown;
  citationCount?: unknown;
  mentionCount?: unknown;
};

type WorkCompletedContent = {
  completedTasks?: unknown;
  deliverablesShipped?: unknown;
};

type EnterpriseAuditContent = {
  score?: unknown;
  confidence?: unknown;
  auditedPages?: unknown;
  dimensions?: unknown;
  topIssues?: unknown;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const report = await db
    .select()
    .from(deliverables)
    .where(eq(deliverables.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!report || report.type !== "monthly_report") {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, report.clientId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  const content = (report.contentJson ?? {}) as Record<string, unknown>;
  const month = String(content.month ?? "unknown-month");
  const visibility = (content.visibility ?? {}) as VisibilityContent;
  const workCompleted = (content.workCompleted ?? {}) as WorkCompletedContent;
  const enterpriseAudit = (content.enterpriseAudit ?? null) as EnterpriseAuditContent | null;

  const pdfBuffer = await renderMonthlyReportPdf({
    clientName: client?.name ?? "Client",
    month,
    data: {
      executiveSummary: String(content.executiveSummary ?? ""),
      wins: (content.wins as string[] | undefined) ?? [],
      losses: (content.losses as string[] | undefined) ?? [],
      nextMonthPlan: (content.nextMonthPlan as string[] | undefined) ?? [],
      visibility: {
        avgShareOfVoice: Number(visibility.avgShareOfVoice ?? 0),
        citationCount: Number(visibility.citationCount ?? 0),
        mentionCount: Number(visibility.mentionCount ?? 0),
      },
      workCompleted: {
        completedTasks: Number(workCompleted.completedTasks ?? 0),
        deliverablesShipped: Number(workCompleted.deliverablesShipped ?? 0),
      },
      recommendationsBacklog:
        (content.recommendationsBacklog as string[] | undefined) ?? [],
      enterpriseAudit:
        enterpriseAudit == null
          ? undefined
          : {
              score: Number(enterpriseAudit.score ?? 0),
              confidence: Number(enterpriseAudit.confidence ?? 0),
              auditedPages: Number(enterpriseAudit.auditedPages ?? 0),
              dimensions: Array.isArray(enterpriseAudit.dimensions)
                ? (enterpriseAudit.dimensions as Array<Record<string, unknown>>).map((d) => ({
                    id: String(d.id ?? "unknown"),
                    score: Number(d.score ?? 0),
                    status: String(d.status ?? "unknown"),
                  }))
                : [],
              topIssues: Array.isArray(enterpriseAudit.topIssues)
                ? (enterpriseAudit.topIssues as Array<Record<string, unknown>>).map((i) => ({
                    location: String(i.location ?? "Unknown"),
                    whyThisMatters: String(i.whyThisMatters ?? ""),
                    improved: String(i.improved ?? ""),
                    implementationEffort: String(i.implementationEffort ?? "medium"),
                    citationLikelihood: Number(i.citationLikelihood ?? 0),
                  }))
                : [],
            },
    },
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="geo-report-${month}.pdf"`,
    },
  });
}

