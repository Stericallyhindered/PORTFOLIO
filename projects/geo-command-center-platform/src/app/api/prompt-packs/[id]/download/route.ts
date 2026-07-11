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
  const row = await db
    .select()
    .from(deliverables)
    .where(
      and(
        eq(deliverables.id, id),
        eq(deliverables.orgId, session.currentOrgId),
        eq(deliverables.type, "content_piece"),
      ),
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!row) {
    return NextResponse.json({ error: "Prompt pack not found" }, { status: 404 });
  }

  const content = (row.contentJson ?? {}) as Record<string, unknown>;
  if (content.kind !== "geo_page_prompt_pack") {
    return NextResponse.json(
      { error: "Deliverable is not a GEO prompt pack" },
      { status: 422 },
    );
  }
  const version = Number(content.version ?? 1);
  if (!Number.isFinite(version) || version < 1) {
    return NextResponse.json(
      { error: "Invalid prompt pack version" },
      { status: 422 },
    );
  }

  const payload = JSON.stringify(content, null, 2);
  return new NextResponse(payload, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="geo-prompt-pack-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

