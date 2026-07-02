import { cookies } from "next/headers";

import { getSessionContext } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";

export async function OrgSwitcher() {
  const session = await getSessionContext();
  const cookieStore = await cookies();
  const rawSessionCookie = cookieStore.get("gcc_session")?.value;

  const currentOrg =
    session?.memberships.find((m) => m.orgId === session.currentOrgId) ??
    session?.memberships[0];

  const label =
    currentOrg?.orgName ?? (rawSessionCookie ? "Current Org" : "Demo Org");

  // TODO: Replace with full org switcher menu + mutation endpoint.

  return (
    <Button variant="outline" size="sm">
      {label}
    </Button>
  );
}

