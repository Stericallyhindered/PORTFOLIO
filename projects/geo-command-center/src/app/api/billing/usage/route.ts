import { NextResponse } from "next/server";

import { getSessionContext } from "@/lib/auth/session";
import { getPlanUsageSummary } from "@/lib/billing/limits";

export async function GET() {
  const session = await getSessionContext();
  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const usage = await getPlanUsageSummary(session.currentOrgId);
  return NextResponse.json(usage);
}

