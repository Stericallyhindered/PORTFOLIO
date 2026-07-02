import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { approvals } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";

const patchSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
  comments: z.string().optional(),
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
    .select()
    .from(approvals)
    .where(eq(approvals.id, id))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  if (!existing) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(approvals)
    .set({
      status: parsed.data.status,
      comments: parsed.data.comments ?? existing.comments,
      decidedAt: parsed.data.status === "pending" ? null : new Date(),
    })
    .where(eq(approvals.id, id))
    .returning();

  return NextResponse.json(updated);
}

