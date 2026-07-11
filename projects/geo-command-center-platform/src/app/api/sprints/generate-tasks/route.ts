import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clients, sprints, taskTemplates, tasks } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";

const schema = z.object({
  sprintId: z.string().uuid(),
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

  const sprint = await db
    .select()
    .from(sprints)
    .where(eq(sprints.id, parsed.data.sprintId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!client || !sprint) {
    return NextResponse.json({ error: "Client or sprint not found" }, { status: 404 });
  }

  const templates = await db
    .select()
    .from(taskTemplates)
    .where(eq(taskTemplates.industry, client.industry ?? "general"));

  const generated =
    templates.length === 0
      ? []
      : await db
          .insert(tasks)
          .values(
            templates.map((tpl) => ({
              sprintId: sprint.id,
              type: tpl.type,
              title: tpl.title,
              description: tpl.description,
              status: "backlog" as const,
            })),
          )
          .returning();

  return NextResponse.json({ ok: true, generated: generated.length });
}

