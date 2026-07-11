import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";
import { buildGeoImplementationPack } from "@/lib/content/geoPlan";

const schema = z.object({
  clientId: z.string().uuid(),
  businessName: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(40).optional(),
  logoUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  serviceType: z.string().min(2).max(120).optional(),
  streetAddress: z.string().min(2).max(200).optional(),
  addressLocality: z.string().min(2).max(120).optional(),
  addressRegion: z.string().min(2).max(120).optional(),
  postalCode: z.string().min(2).max(40).optional(),
  addressCountry: z.string().min(2).max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  areaServed: z.array(z.string().min(2).max(120)).max(50).optional(),
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

  const built = await buildGeoImplementationPack({
    ...parsed.data,
    orgId: session.currentOrgId,
  });

  return NextResponse.json({
    ok: true,
    deliverableId: built.deliverableId,
    title: built.title,
    summary: built.plan.summary,
  });
}

