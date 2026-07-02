import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";

import { getSessionContext } from "@/lib/auth/session";
import { ACTIVE_CLIENT_COOKIE } from "@/lib/context/active-client";
import { fastapiFetch } from "@/lib/fastapiClient";

const schema = z.object({
  clientId: z.string().uuid(),
});

export async function GET() {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const projects = await fastapiFetch<{
    items: Array<{ id: string }>;
  }>("/projects/", undefined, session.currentOrgId).catch(() => ({ items: [] }));
  const cookieStore = await cookies();
  const selectedClientId = cookieStore.get(ACTIVE_CLIENT_COOKIE)?.value ?? null;
  const active = projects.items.find((project) => project.id === selectedClientId) ?? projects.items[0] ?? null;
  return NextResponse.json({ clientId: active?.id ?? null });
}

export async function POST(req: Request) {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const projects = await fastapiFetch<{
    items: Array<{ id: string }>;
  }>("/projects/", undefined, session.currentOrgId).catch(() => ({ items: [] }));

  const client = projects.items.find((project) => project.id === parsed.data.clientId);

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const res = NextResponse.json({ ok: true, clientId: client.id });
  res.cookies.set(ACTIVE_CLIENT_COOKIE, client.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}

