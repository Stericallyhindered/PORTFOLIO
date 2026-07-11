import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { getSessionContext } from "@/lib/auth/session";
import { db } from "@/db/client";
import { trackedQueries } from "@/db/schema";

export async function GET() {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(trackedQueries)
    .where(eq(trackedQueries.orgId, session.currentOrgId));

  const header = ["id", "client_id", "query_text", "intent", "priority", "region", "language"];
  const lines = [
    header.join(","),
    ...rows.map((r) =>
      [r.id, r.clientId, r.queryText, r.intent, r.priority, r.region, r.language]
        .map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=tracked-queries.csv",
    },
  });
}

