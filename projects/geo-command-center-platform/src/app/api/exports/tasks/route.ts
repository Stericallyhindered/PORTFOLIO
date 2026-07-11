import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getSessionContext } from "@/lib/auth/session";
import { db } from "@/db/client";
import { tasks, sprints, programs, clients } from "@/db/schema";

export async function GET() {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientRows = await db
    .select()
    .from(clients)
    .where(eq(clients.orgId, session.currentOrgId));
  const clientIds = new Set(clientRows.map((c) => c.id));

  const sprintRows = await db.select().from(sprints);
  const programRows = await db.select().from(programs);
  const allTasks = await db.select().from(tasks);

  const sprintById = new Map(sprintRows.map((s) => [s.id, s]));
  const programById = new Map(programRows.map((p) => [p.id, p]));

  const visibleTasks = allTasks.filter((task) => {
    const sprint = sprintById.get(task.sprintId);
    if (!sprint) return false;
    const program = programById.get(sprint.programId);
    if (!program) return false;
    return clientIds.has(program.clientId);
  });

  const header = ["id", "sprint_id", "title", "type", "status", "priority", "due_date"];
  const lines = [
    header.join(","),
    ...visibleTasks.map((r) =>
      [r.id, r.sprintId, r.title, r.type, r.status, r.priority, r.dueDate]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=tasks.csv",
    },
  });
}

