import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { clients, contentAudits, pages } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";

const schema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(500),
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

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const audits = await db
    .select()
    .from(contentAudits)
    .where(inArray(contentAudits.id, parsed.data.ids));

  if (audits.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  const pageIds = audits.map((a) => a.pageId);
  const pageRows = await db.select().from(pages).where(inArray(pages.id, pageIds));
  const clientIds = [...new Set(pageRows.map((p) => p.clientId))];
  const orgClients = await db
    .select()
    .from(clients)
    .where(
      and(
        inArray(clients.id, clientIds),
        eq(clients.orgId, session.currentOrgId),
      ),
    );
  const allowedClientIds = new Set(orgClients.map((c) => c.id));
  const allowedPageIds = new Set(
    pageRows.filter((p) => allowedClientIds.has(p.clientId)).map((p) => p.id),
  );
  const allowedAuditIds = audits
    .filter((a) => allowedPageIds.has(a.pageId))
    .map((a) => a.id);

  if (allowedAuditIds.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  await db.delete(contentAudits).where(inArray(contentAudits.id, allowedAuditIds));
  return NextResponse.json({ ok: true, deleted: allowedAuditIds.length });
}

