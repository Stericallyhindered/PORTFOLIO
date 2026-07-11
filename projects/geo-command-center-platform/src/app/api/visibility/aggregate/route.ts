import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";
import { getGeoPromptRunsQueue } from "@/lib/jobs/queues";

const schema = z.object({
  dateISO: z.string().datetime().optional(),
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

  const queue = getGeoPromptRunsQueue();
  const job = await queue.add("aggregateVisibilityDaily", {
    dateISO: parsed.data.dateISO,
  });

  return NextResponse.json({ ok: true, jobId: job.id });
}

