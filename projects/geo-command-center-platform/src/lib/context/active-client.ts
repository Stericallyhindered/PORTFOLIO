import "server-only";

import { cookies } from "next/headers";
import { fastapiFetch } from "@/lib/fastapiClient";

export const ACTIVE_CLIENT_COOKIE = "gcc_active_client_id";

export type OrgClientSummary = {
  id: string;
  name: string;
  websiteUrl: string;
};

export async function getOrgClients(orgId: string): Promise<OrgClientSummary[]> {
  const [projectsRes, domainsRes] = await Promise.all([
    fastapiFetch<{
      items: Array<{
        id: string;
        name: string;
        primary_domain: string | null;
      }>;
    }>("/projects/", undefined, orgId).catch(() => ({ items: [] })),
    fastapiFetch<{
      items: Array<{
        project_id: string;
        domain: string;
        is_primary: boolean;
      }>;
    }>("/domains/", undefined, orgId).catch(() => ({ items: [] })),
  ]);

  const domainsByProject = new Map<string, string>();
  for (const domain of domainsRes.items) {
    if (domain.is_primary || !domainsByProject.has(domain.project_id)) {
      domainsByProject.set(domain.project_id, domain.domain);
    }
  }

  return projectsRes.items.map((project) => {
    const domain = project.primary_domain ?? domainsByProject.get(project.id) ?? "";
    return {
      id: project.id,
      name: project.name,
      websiteUrl: domain ? `https://${domain}` : "—",
    };
  });
}

export async function getActiveClientForOrg(orgId: string): Promise<{
  activeClient: OrgClientSummary | null;
  orgClients: OrgClientSummary[];
}> {
  const orgClients = await getOrgClients(orgId);
  if (orgClients.length === 0) {
    return { activeClient: null, orgClients };
  }

  const cookieStore = await cookies();
  const selectedClientId = cookieStore.get(ACTIVE_CLIENT_COOKIE)?.value ?? null;
  const activeClient =
    orgClients.find((client) => client.id === selectedClientId) ?? orgClients[0];

  return { activeClient, orgClients };
}

