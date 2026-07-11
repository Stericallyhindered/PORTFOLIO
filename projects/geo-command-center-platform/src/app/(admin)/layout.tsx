import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";

type AdminLayoutProps = {
  children: ReactNode;
};

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await getSessionContext();

  if (!session) {
    redirect("/login");
  }

  const role = Object.values(session.rolesByOrg)[0];

  if (!role || !canManageClients(role)) {
    redirect("/app");
  }

  return <AppShell>{children}</AppShell>;
}

