import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getSessionContext } from "@/lib/auth/session";
import { OrgSwitcher } from "@/components/nav/OrgSwitcher";
import { SidebarNav } from "@/components/nav/SidebarNav";
import { getActiveClientForOrg } from "@/lib/context/active-client";
import { ActiveWebsiteSwitcher } from "@/components/nav/ActiveWebsiteSwitcher";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const session = await getSessionContext();

  if (!session) {
    redirect("/login");
  }

  const { activeClient, orgClients } = await getActiveClientForOrg(
    session.currentOrgId ?? "",
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <SidebarNav />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b px-4">
          <div className="flex items-center gap-3">
            <span className="font-semibold tracking-tight">
              GEO Command Center
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ActiveWebsiteSwitcher
              clients={orgClients}
              currentClientId={activeClient?.id}
            />
            <OrgSwitcher />
          </div>
        </header>
        <main className="flex-1 bg-muted/40 p-4">{children}</main>
      </div>
    </div>
  );
}

