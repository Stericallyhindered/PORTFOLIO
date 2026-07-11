import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { clients, contentAudits, pages } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";

const schema = z.object({
  clientId: z.string().uuid(),
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

  const clientPages = await db
    .select({ id: pages.id })
    .from(pages)
    .where(eq(pages.clientId, client.id));

  const pageIds = clientPages.map((p) => p.id);
  if (pageIds.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  const findings = await db
    .select({ id: contentAudits.id })
    .from(contentAudits)
    .where(inArray(contentAudits.pageId, pageIds));

  const findingIds = findings.map((f) => f.id);
  if (findingIds.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  await db.delete(contentAudits).where(inArray(contentAudits.id, findingIds));
  return NextResponse.json({ ok: true, deleted: findingIds.length });
}

