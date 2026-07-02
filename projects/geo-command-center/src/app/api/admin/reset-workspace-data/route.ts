import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";
import { ACTIVE_CLIENT_COOKIE } from "@/lib/context/active-client";
import { fastapiFetch } from "@/lib/fastapiClient";

export async function POST() {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.rolesByOrg[session.currentOrgId];
  if (!role || !canManageClients(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const orgId = session.currentOrgId;
  let clearedProjects = 0;
  try {
    const response = await fastapiFetch<{ ok: boolean; clearedProjects: number }>(
      "/settings/reset-workspace-data",
      { method: "POST" },
      orgId,
    );
    clearedProjects = response.clearedProjects ?? 0;
  } catch (error) {
    const res = NextResponse.json({
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to clear workspace data",
    });
    // Even if backend reset failed, clear active selection to avoid stale IDs.
    res.cookies.set(ACTIVE_CLIENT_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return res;
  }

  const res = NextResponse.json({ ok: true, clearedProjects });
  res.cookies.set(ACTIVE_CLIENT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
  return res;
}

