import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { deliverables } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_req: Request, { params }: RouteContext) {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deliverable = await db
    .select()
    .from(deliverables)
    .where(
      and(
        eq(deliverables.id, id),
        eq(deliverables.orgId, session.currentOrgId),
        eq(deliverables.type, "schema_update"),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!deliverable) {
    return NextResponse.json({ error: "Package not found" }, { status: 404 });
  }

  const payload = JSON.stringify(deliverable.contentJson ?? {}, null, 2);
  const fileSafeDate = new Date().toISOString().slice(0, 10);

  return new NextResponse(payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="geo-package-${fileSafeDate}.json"`,
    },
  });
}

