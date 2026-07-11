import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";
import { fastapiFetch } from "@/lib/fastapiClient";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_req: Request, { params }: RouteContext) {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.rolesByOrg[session.currentOrgId];
  if (!role || !canManageClients(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  try {
    await fastapiFetch(
      `/reports/exports/${encodeURIComponent(id)}`,
      { method: "DELETE" },
      session.currentOrgId,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Delete failed";
    const status = message.includes("(404)") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
  return NextResponse.json({ ok: true });
}

