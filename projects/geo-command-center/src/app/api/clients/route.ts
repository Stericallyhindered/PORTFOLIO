import { NextResponse } from "next/server";

import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";
import { createClientSchema } from "@/lib/schemas/client";
import { fastapiFetch } from "@/lib/fastapiClient";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function extractDomain(rawUrl: string) {
  const url = new URL(rawUrl);
  return url.hostname.toLowerCase();
}

export async function GET() {
  const session = await getSessionContext();

  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [projectsRes, domainsRes] = await Promise.all([
    fastapiFetch<{
      items: Array<{
        id: string;
        name: string;
        primary_domain: string | null;
      }>;
    }>("/projects/", undefined, session.currentOrgId),
    fastapiFetch<{
      items: Array<{
        project_id: string;
        domain: string;
        is_primary: boolean;
      }>;
    }>("/domains/", undefined, session.currentOrgId),
  ]);

  const domainsByProject = new Map<string, string>();
  for (const domain of domainsRes.items) {
    if (domain.is_primary || !domainsByProject.has(domain.project_id)) {
      domainsByProject.set(domain.project_id, domain.domain);
    }
  }

  const rows = projectsRes.items.map((project) => {
    const domain = project.primary_domain ?? domainsByProject.get(project.id) ?? "";
    return {
      id: project.id,
      orgId: session.currentOrgId,
      name: project.name,
      websiteUrl: domain ? `https://${domain}` : "",
    };
  });

  return NextResponse.json(rows, { status: 200 });
}

export async function POST(req: Request) {
  const session = await getSessionContext();

  if (!session || !session.currentOrgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.rolesByOrg[session.currentOrgId];
  if (!role || !canManageClients(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json();
  const parsed = createClientSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation error", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const payload = parsed.data;

  const domain = extractDomain(payload.websiteUrl);
  let baseSlug = toSlug(payload.name);
  if (!baseSlug) {
    baseSlug = toSlug(domain);
  }

  let createdProject: {
    id: string;
    name: string;
    slug: string;
    primary_domain: string | null;
  } | null = null;

  let slugAttempt = baseSlug;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const projectRes = await fastapiFetch<{
        item: {
          id: string;
          name: string;
          slug: string;
          primary_domain: string | null;
        };
      }>(
        "/projects/",
        {
          method: "POST",
          body: JSON.stringify({
            name: payload.name,
            slug: slugAttempt,
            brand_name: payload.name,
            primary_domain: domain,
            locale: "en-US",
          }),
        },
        session.currentOrgId,
      );
      createdProject = projectRes.item;
      break;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("(409)")) {
        throw error;
      }
      slugAttempt = `${baseSlug}-${attempt + 2}`;
    }
  }

  if (!createdProject) {
    return NextResponse.json(
      { error: "Unable to create project after multiple slug attempts" },
      { status: 409 },
    );
  }

  await fastapiFetch(
    "/domains/",
    {
      method: "POST",
      body: JSON.stringify({
        project_id: createdProject.id,
        domain,
        is_primary: true,
      }),
    },
    session.currentOrgId,
  ).catch(() => null);

  return NextResponse.json(
    {
      id: createdProject.id,
      orgId: session.currentOrgId,
      name: createdProject.name,
      websiteUrl: payload.websiteUrl,
    },
    { status: 201 },
  );
}

