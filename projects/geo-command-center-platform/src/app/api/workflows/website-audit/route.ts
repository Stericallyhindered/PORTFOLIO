import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import { clients } from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";
import { runContentAuditForClient } from "@/lib/content/runContentAudit";
import { ACTIVE_CLIENT_COOKIE } from "@/lib/context/active-client";

const schema = z.object({
  websiteUrl: z.string().min(3),
  clientName: z.string().min(2).max(120).optional(),
  clientId: z.string().uuid().optional(),
});

function normalizeWebsiteUrl(raw: string) {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(withProtocol);
  url.hash = "";
  return url.toString().replace(/\/$/, "");
}

function fallbackClientNameFromUrl(urlString: string) {
  const host = new URL(urlString).hostname;
  return host.replace(/^www\./, "");
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

  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeWebsiteUrl(parsed.data.websiteUrl);
  } catch {
    return NextResponse.json({ error: "Invalid website URL" }, { status: 422 });
  }

  let client =
    parsed.data.clientId == null
      ? null
      : await db
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
    client = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.orgId, session.currentOrgId),
          eq(clients.websiteUrl, normalizedUrl),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  if (!client) {
    const [created] = await db
      .insert(clients)
      .values({
        orgId: session.currentOrgId,
        name: parsed.data.clientName?.trim() || fallbackClientNameFromUrl(normalizedUrl),
        websiteUrl: normalizedUrl,
      })
      .returning();
    client = created;
  } else if (client.websiteUrl !== normalizedUrl) {
    const existingForUrl = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.orgId, session.currentOrgId),
          eq(clients.websiteUrl, normalizedUrl),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (existingForUrl) {
      client = existingForUrl;
    } else {
      const [created] = await db
        .insert(clients)
        .values({
          orgId: session.currentOrgId,
          name:
            parsed.data.clientName?.trim() || fallbackClientNameFromUrl(normalizedUrl),
          websiteUrl: normalizedUrl,
        })
        .returning();
      client = created;
    }
  }

  const result = await runContentAuditForClient(client.id);

  const response = NextResponse.json({
    ok: true,
    clientId: client.id,
    clientName: client.name,
    websiteUrl: client.websiteUrl,
    auditedPages: result.auditedPages,
    auditRunAt: result.auditRunAt,
    auditFolderKey: result.auditFolderKey,
  });
  response.cookies.set(ACTIVE_CLIENT_COOKIE, client.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

