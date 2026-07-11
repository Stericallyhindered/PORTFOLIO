import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";
import { db } from "@/db/client";
import { clients, deliverables } from "@/db/schema";
import { generateMonthlyReportData } from "@/lib/reports/monthly";

const createSchema = z.object({
  clientId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/),
});

export async function POST(req: Request) {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.rolesByOrg[session.currentOrgId];
  if (!role || !canManageClients(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const client = await db
    .select()
    .from(clients)
    .where(
      and(
        eq(clients.id, parsed.data.clientId),
        eq(clients.orgId, session.currentOrgId),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const reportData = await generateMonthlyReportData(client.id, parsed.data.month);

  const [report] = await db
    .insert(deliverables)
    .values({
      clientId: client.id,
      orgId: session.currentOrgId,
      type: "monthly_report",
      title: `Monthly GEO Report ${parsed.data.month}`,
      description: `Auto-generated report for ${client.name}`,
      status: "in_review",
      contentJson: {
        month: parsed.data.month,
        ...reportData,
      },
    })
    .returning();

  return NextResponse.json({ ok: true, reportId: report.id });
}

