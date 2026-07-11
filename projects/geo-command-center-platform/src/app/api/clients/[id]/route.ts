import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clients } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";
import { updateClientSchema } from "@/lib/schemas/client";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getSessionContext();

  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!client || client.orgId !== session.currentOrgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getSessionContext();

  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.rolesByOrg[session.currentOrgId];
  if (!role || !canManageClients(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1)
    .then((rows) => rows[0]);

  if (!existing || existing.orgId !== session.currentOrgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const json = await req.json();
  const parsed = updateClientSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const payload = parsed.data;

  const [updated] = await db
    .update(clients)
    .set({
      name: payload.name ?? existing.name,
      websiteUrl: payload.websiteUrl ?? existing.websiteUrl,
      industry: payload.industry ?? existing.industry,
      regions: payload.regions ?? existing.regions,
      competitors: payload.competitors ?? existing.competitors,
    })
    .where(eq(clients.id, existing.id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const { id } = await params;
  const session = await getSessionContext();

  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.rolesByOrg[session.currentOrgId];
  if (!role || !canManageClients(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await db
    .select()
    .from(clients)
    .where(eq(clients.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!existing || existing.orgId !== session.currentOrgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db.delete(clients).where(eq(clients.id, existing.id));
  return NextResponse.json({ ok: true });
}

