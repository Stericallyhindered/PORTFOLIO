import { NextResponse } from "next/server";
import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db/client";
import { clients, contentAudits, pages } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { buildEnterpriseAuditSummary } from "@/lib/content/enterpriseSummary";
import { renderEnterpriseAuditPdf } from "@/lib/reports/pdf";

export async function GET(req: Request) {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");
  const folder = url.searchParams.get("folder");
  const format = url.searchParams.get("format") ?? "json";
  if (!clientId) {
    return NextResponse.json({ error: "clientId is required" }, { status: 422 });
  }

  const client = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, clientId), eq(clients.orgId, session.currentOrgId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const pageRows = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.clientId, client.id))
    .limit(2000);
  const pageIds = pageRows.map((p) => p.id);
  if (pageIds.length === 0) {
    return NextResponse.json({ error: "No audits found" }, { status: 404 });
  }

  const rows = await db
    .select({
      score: contentAudits.score,
      auditDate: contentAudits.auditDate,
      issuesJson: contentAudits.issuesJson,
      recommendationsJson: contentAudits.recommendationsJson,
    })
    .from(contentAudits)
    .where(inArray(contentAudits.pageId, pageIds))
    .orderBy(desc(contentAudits.auditDate))
    .limit(1000);

  const scopedRows =
    folder == null
      ? rows
      : rows.filter((r) => new Date(r.auditDate).toISOString() === folder);
  const summary = buildEnterpriseAuditSummary(scopedRows);
  const payload = {
    kind: "enterprise_geo_audit_export",
    generatedAt: new Date().toISOString(),
    websiteUrl: client.websiteUrl,
    folder: folder ?? null,
    summary,
  };

  if (format === "pdf") {
    const pdf = await renderEnterpriseAuditPdf({
      websiteUrl: client.websiteUrl,
      generatedAt: payload.generatedAt,
      summary,
    });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="enterprise-geo-audit.pdf"',
      },
    });
  }

  return NextResponse.json(payload, {
    headers: {
      "Content-Disposition": 'attachment; filename="enterprise-geo-audit.json"',
    },
  });
}
