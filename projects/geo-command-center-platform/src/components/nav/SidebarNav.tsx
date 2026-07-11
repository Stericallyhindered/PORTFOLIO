"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/app/dashboard", label: "Dashboard" },
  { href: "/app/content-audits", label: "Control Panel" },
  { href: "/app/visibility", label: "Visibility" },
  { href: "/app/prompt-clusters", label: "Prompt Clusters (Evidence)" },
  { href: "/app/engine-runs", label: "Engine Runs (Evidence)" },
  { href: "/app/citations", label: "Citations (Evidence)" },
  { href: "/app/recommendations", label: "Recommendations" },
  { href: "/app/entities", label: "Entities" },
  { href: "/app/tasks", label: "Tasks" },
  { href: "/app/sprints/current", label: "Sprints" },
  { href: "/app/reports", label: "Reports" },
  { href: "/app/settings", label: "Settings" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 border-r bg-sidebar p-3 text-sm md:flex md:flex-col">
      <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        GEO Command Center
      </div>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map((link) => {
          const active =
            pathname === link.href || pathname?.startsWith(link.href + "/");

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded px-2 py-1.5 text-left text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

