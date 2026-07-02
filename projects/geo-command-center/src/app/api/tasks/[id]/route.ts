import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clients, programs, sprints, tasks } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";

const patchSchema = z.object({
  status: z
    .enum(["backlog", "in_progress", "in_review", "blocked", "done"])
    .optional(),
  title: z.string().min(2).optional(),
  description: z.string().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(req: Request, { params }: RouteContext) {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const existing = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(sprints, eq(sprints.id, tasks.sprintId))
    .innerJoin(programs, eq(programs.id, sprints.programId))
    .innerJoin(clients, eq(clients.id, programs.clientId))
    .where(and(eq(tasks.id, id), eq(clients.orgId, session.currentOrgId)))
    .limit(1)
    .then((rows) => rows[0]?.task ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(tasks)
    .set({
      status: parsed.data.status ?? existing.status,
      title: parsed.data.title ?? existing.title,
      description: parsed.data.description ?? existing.description,
    })
    .where(eq(tasks.id, existing.id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const existing = await db
    .select({ task: tasks })
    .from(tasks)
    .innerJoin(sprints, eq(sprints.id, tasks.sprintId))
    .innerJoin(programs, eq(programs.id, sprints.programId))
    .innerJoin(clients, eq(clients.id, programs.clientId))
    .where(and(eq(tasks.id, id), eq(clients.orgId, session.currentOrgId)))
    .limit(1)
    .then((rows) => rows[0]?.task ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  await db.delete(tasks).where(eq(tasks.id, existing.id));
  return NextResponse.json({ ok: true });
}

