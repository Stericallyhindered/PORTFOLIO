import type { ReactNode } from "react";

import { AppShell } from "@/components/layout/AppShell";
import { DiagnosticConsole } from "@/components/diagnostics/DiagnosticConsole";

type AppLayoutProps = {
  children: ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <>
      <AppShell>{children}</AppShell>
      <DiagnosticConsole />
    </>
  );
}

