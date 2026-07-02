import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";

import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";
import { trackedQueries } from "@/db/schema";
import { db } from "@/db/client";
import { getGeoPromptRunsQueue } from "@/lib/jobs/queues";
import { enforcePlanLimit } from "@/lib/billing/limits";

const runSchema = z.object({
  mode: z.enum(["single", "allActive"]).default("allActive"),
  trackedQueryId: z.string().uuid().optional(),
  engineSlug: z.string().default("perplexity"),
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

  const parsed = runSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const input = parsed.data;
  const engineLimit = await enforcePlanLimit(session.currentOrgId, "engines");
  if (!engineLimit.allowed) {
    return NextResponse.json({ error: engineLimit.reason }, { status: 402 });
  }

  if (input.mode === "single" && input.trackedQueryId) {
    const geoPromptRunsQueue = getGeoPromptRunsQueue();
    const query = await db
      .select()
      .from(trackedQueries)
      .where(
        and(
          eq(trackedQueries.id, input.trackedQueryId),
          eq(trackedQueries.orgId, session.currentOrgId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (!query) {
      return NextResponse.json({ error: "Tracked query not found" }, { status: 404 });
    }

    const job = await geoPromptRunsQueue.add("runTrackedQuery", {
      trackedQueryId: query.id,
      engineSlug: input.engineSlug,
    });

    return NextResponse.json({ ok: true, jobId: job.id });
  }

  const geoPromptRunsQueue = getGeoPromptRunsQueue();
  const job = await geoPromptRunsQueue.add("runAllActiveQueries", {
    engineSlug: input.engineSlug,
  });

  return NextResponse.json({ ok: true, jobId: job.id });
}

