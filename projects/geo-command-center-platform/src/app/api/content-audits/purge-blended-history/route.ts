import { NextResponse } from "next/server";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { clients, contentAudits, deliverables, pages } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";

const schema = z.object({
  clientId: z.string().uuid(),
});

function normalizedHost(urlString: string) {
  return new URL(urlString).hostname.replace(/^www\./, "").toLowerCase();
}

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

  const targetHost = normalizedHost(client.websiteUrl);
  const clientPages = await db
    .select()
    .from(pages)
    .where(eq(pages.clientId, client.id));

  const blendedPageIds = clientPages
    .filter((page) => {
      try {
        return normalizedHost(page.url) !== targetHost;
      } catch {
        return true;
      }
    })
    .map((page) => page.id);

  let deletedAuditCount = 0;
  let deletedPageCount = 0;

  if (blendedPageIds.length > 0) {
    const blendedAudits = await db
      .select({ id: contentAudits.id })
      .from(contentAudits)
      .where(inArray(contentAudits.pageId, blendedPageIds));

    if (blendedAudits.length > 0) {
      const blendedAuditIds = blendedAudits.map((a) => a.id);
      await db.delete(contentAudits).where(inArray(contentAudits.id, blendedAuditIds));
      deletedAuditCount = blendedAuditIds.length;
    }

    await db.delete(pages).where(inArray(pages.id, blendedPageIds));
    deletedPageCount = blendedPageIds.length;
  }

  const candidateDeliverables = await db
    .select()
    .from(deliverables)
    .where(eq(deliverables.clientId, client.id));

  const blendedDeliverableIds = candidateDeliverables
    .filter((d) => {
      const content = (d.contentJson ?? {}) as Record<string, unknown>;
      const website = content.website;
      if (typeof website !== "string" || website.trim() === "") return false;
      try {
        return normalizedHost(website) !== targetHost;
      } catch {
        return false;
      }
    })
    .map((d) => d.id);

  let deletedDeliverableCount = 0;
  if (blendedDeliverableIds.length > 0) {
    await db
      .delete(deliverables)
      .where(inArray(deliverables.id, blendedDeliverableIds));
    deletedDeliverableCount = blendedDeliverableIds.length;
  }

  return NextResponse.json({
    ok: true,
    targetHost,
    deletedAuditCount,
    deletedPageCount,
    deletedDeliverableCount,
  });
}

