import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";
import { buildGeoPromptPack } from "@/lib/content/promptPack";

const schema = z.object({
  geoPackageId: z.string().uuid(),
  tone: z.string().min(2).max(120).optional(),
  audience: z.string().min(2).max(160).optional(),
  optimizeLegalPages: z.boolean().optional(),
  includeHtmlBlocks: z.boolean().optional(),
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

  const created = await buildGeoPromptPack({
    geoPackageId: parsed.data.geoPackageId,
    orgId: session.currentOrgId,
    tone: parsed.data.tone,
    audience: parsed.data.audience,
    optimizeLegalPages: parsed.data.optimizeLegalPages,
    includeHtmlBlocks: parsed.data.includeHtmlBlocks,
  });

  return NextResponse.json({ ok: true, promptPackId: created.id, title: created.title });
}

