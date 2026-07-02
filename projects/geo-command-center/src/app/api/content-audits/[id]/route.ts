import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clients, contentAudits, pages } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.rolesByOrg[session.currentOrgId];
  if (!role || !canManageClients(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const audit = await db
    .select()
    .from(contentAudits)
    .where(eq(contentAudits.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!audit) {
    return NextResponse.json({ error: "Audit finding not found" }, { status: 404 });
  }

  const page = await db
    .select()
    .from(pages)
    .where(eq(pages.id, audit.pageId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!page) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const client = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, page.clientId), eq(clients.orgId, session.currentOrgId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!client) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(contentAudits).where(eq(contentAudits.id, audit.id));
  return NextResponse.json({ ok: true });
}

