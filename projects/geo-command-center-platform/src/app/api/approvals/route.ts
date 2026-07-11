import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { getSessionContext } from "@/lib/auth/session";
import { db } from "@/db/client";
import { approvals, deliverables, clients } from "@/db/schema";

const createSchema = z.object({
  deliverableId: z.string().uuid(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  comments: z.string().optional(),
});

export async function GET(req: Request) {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientRows = await db
    .select()
    .from(clients)
    .where(eq(clients.orgId, session.currentOrgId));
  const clientIds = new Set(clientRows.map((c) => c.id));

  const deliverableRows = await db.select().from(deliverables).limit(300);
  const allowedDeliverableIds = new Set(
    deliverableRows.filter((d) => clientIds.has(d.clientId)).map((d) => d.id),
  );

  const allApprovals = await db.select().from(approvals).limit(300);
  const filtered = allApprovals.filter((a) => allowedDeliverableIds.has(a.deliverableId));

  return NextResponse.json(filtered);
}

export async function POST(req: Request) {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const deliverable = await db
    .select()
    .from(deliverables)
    .where(eq(deliverables.id, parsed.data.deliverableId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!deliverable) {
    return NextResponse.json({ error: "Deliverable not found" }, { status: 404 });
  }

  const client = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, deliverable.clientId), eq(clients.orgId, session.currentOrgId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!client) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [created] = await db
    .insert(approvals)
    .values({
      deliverableId: deliverable.id,
      clientUserId: null,
      status: parsed.data.status,
      comments: parsed.data.comments ?? null,
      decidedAt: parsed.data.status === "pending" ? null : new Date(),
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

