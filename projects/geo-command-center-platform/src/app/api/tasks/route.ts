import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { getSessionContext } from "@/lib/auth/session";
import { tasks, sprints, programs, clients } from "@/db/schema";
import { getActiveClientForOrg } from "@/lib/context/active-client";

export async function GET(req: Request) {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const statuses = url.searchParams.get("statuses");
  const clientIdParam = url.searchParams.get("clientId");
  const filterStatuses = statuses
    ? statuses.split(",").map((s) => s.trim()).filter(Boolean)
    : null;
  const { activeClient } = await getActiveClientForOrg(session.currentOrgId);
  const scopedClientId = clientIdParam ?? activeClient?.id ?? null;
  if (!scopedClientId) {
    return NextResponse.json([]);
  }

  const allTasks = await db.select().from(tasks).limit(500);
  const sprintRows = await db.select().from(sprints);
  const programRows = await db.select().from(programs);
  const clientRows = await db
    .select()
    .from(clients)
    .where(eq(clients.orgId, session.currentOrgId));

  const sprintById = new Map(sprintRows.map((s) => [s.id, s]));
  const programById = new Map(programRows.map((p) => [p.id, p]));
  const allowedClientIds = new Set(
    clientRows.filter((c) => c.id === scopedClientId).map((c) => c.id),
  );

  const filtered = allTasks.filter((task) => {
    if (filterStatuses && !filterStatuses.includes(task.status)) {
      return false;
    }
    const sprint = sprintById.get(task.sprintId);
    if (!sprint) return false;
    const program = programById.get(sprint.programId);
    if (!program) return false;
    return allowedClientIds.has(program.clientId);
  });

  return NextResponse.json(filtered);
}

