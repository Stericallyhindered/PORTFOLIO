import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";
import { clients } from "@/db/schema";
import { db } from "@/db/client";
import { getContentAuditQueue } from "@/lib/jobs/queues";
import { runContentAuditForClient } from "@/lib/content/runContentAudit";

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

  try {
    const queue = getContentAuditQueue();
    const job = await queue.add("runClientAudit", {
      clientId: client.id,
    });
    return NextResponse.json({ ok: true, jobId: job.id, mode: "queued" });
  } catch {
    const result = await runContentAuditForClient(client.id);
    return NextResponse.json({
      ok: true,
      mode: "direct",
      auditedPages: result.auditedPages,
      auditRunAt: result.auditRunAt,
      auditFolderKey: result.auditFolderKey,
    });
  }
}

