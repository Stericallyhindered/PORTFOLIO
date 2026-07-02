import { getSessionContext } from "@/lib/auth/session";
import { fastapiFetch } from "@/lib/fastapiClient";
import { DataTable } from "@/components/data-table/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { NewClientForm } from "@/components/admin/NewClientForm";
import { ActiveWebsiteSwitcher } from "@/components/nav/ActiveWebsiteSwitcher";
import { getActiveClientForOrg } from "@/lib/context/active-client";

type ClientRow = {
  id: string;
  name: string;
  industry: string;
  websiteUrl: string;
};

export const metadata = {
  title: "Clients | GEO Command Center",
};

export default async function AdminClientsPage() {
  const session = await getSessionContext();

  if (!session || !session.currentOrgId) {
    return null;
  }

  const [projectsRes, domainsRes] = await Promise.all([
    fastapiFetch<{
      items: Array<{
        id: string;
        name: string;
        primary_domain: string | null;
      }>;
    }>("/projects/", undefined, session.currentOrgId).catch(() => ({ items: [] })),
    fastapiFetch<{
      items: Array<{
        project_id: string;
        domain: string;
        is_primary: boolean;
      }>;
    }>("/domains/", undefined, session.currentOrgId).catch(() => ({ items: [] })),
  ]);

  const domainsByProject = new Map<string, string>();
  for (const domain of domainsRes.items) {
    if (domain.is_primary || !domainsByProject.has(domain.project_id)) {
      domainsByProject.set(domain.project_id, domain.domain);
    }
  }

  const data: ClientRow[] = projectsRes.items.map((project) => ({
    id: project.id,
    name: project.name,
    industry: "—",
    websiteUrl:
      project.primary_domain != null && project.primary_domain.length > 0
        ? `https://${project.primary_domain}`
        : domainsByProject.get(project.id)
          ? `https://${domainsByProject.get(project.id)}`
          : "—",
  }));

  const columns: ColumnDef<ClientRow>[] = [
    {
      accessorKey: "name",
      header: "Client",
    },
    {
      accessorKey: "industry",
      header: "Industry",
    },
    {
      accessorKey: "websiteUrl",
      header: "Website",
    },
  ];
  const { activeClient, orgClients } = await getActiveClientForOrg(session.currentOrgId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage client organizations, integrations, entities, and GEO
            programs.
          </p>
        </div>
        <NewClientForm />
      </div>
      <div className="rounded-md border bg-background p-3">
        <p className="text-sm font-medium">Configure Client URL (Active Website)</p>
        <p className="text-xs text-muted-foreground">
          Select which website/project is active for audits, scoring, reports, and one-click runs.
        </p>
        <div className="mt-2">
          <ActiveWebsiteSwitcher
            clients={orgClients}
            currentClientId={activeClient?.id}
          />
        </div>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}

