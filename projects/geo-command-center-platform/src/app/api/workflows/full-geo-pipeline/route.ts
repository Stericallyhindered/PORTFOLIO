import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db/client";
import {
  aiEngines,
  clients,
  deliverables,
  trackedQueries,
  programs,
  sprints,
  tasks,
} from "@/db/schema";
import { getSessionContext } from "@/lib/auth/session";
import { canManageClients } from "@/lib/auth/roles";
import { runContentAuditForClient } from "@/lib/content/runContentAudit";
import { buildGeoImplementationPack } from "@/lib/content/geoPlan";
import { runTrackedQuery } from "@/lib/geo/runner";
import { aggregateVisibilityMetricsForDay } from "@/lib/geo/metrics";
import { getActiveClientForOrg, ACTIVE_CLIENT_COOKIE } from "@/lib/context/active-client";

const schema = z.object({
  clientId: z.string().uuid().optional(),
  websiteUrl: z.string().min(3).optional(),
  clientName: z.string().min(2).max(120).optional(),
  businessName: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(40).optional(),
  logoUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  serviceType: z.string().min(2).max(120).optional(),
  streetAddress: z.string().min(2).max(200).optional(),
  addressLocality: z.string().min(2).max(120).optional(),
  addressRegion: z.string().min(2).max(120).optional(),
  postalCode: z.string().min(2).max(40).optional(),
  addressCountry: z.string().min(2).max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  areaServed: z.array(z.string().min(2).max(120)).max(50).optional(),
});

function normalizeHost(urlString: string) {
  return new URL(urlString).hostname.replace(/^www\./, "");
}

function normalizeWebsiteUrl(raw: string) {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const u = new URL(withProtocol);
  u.hash = "";
  return u.toString().replace(/\/$/, "");
}

async function ensureEngines() {
  const definitions = [
    {
      slug: "chatgpt",
      displayName: "ChatGPT",
      enabled: true,
      capabilitiesJson: { live: Boolean(process.env.PERPLEXITY_API_KEY), category: "llm_answer_engine" },
    },
    {
      slug: "google-ai-overviews",
      displayName: "Google AI Overviews",
      enabled: true,
      capabilitiesJson: { live: Boolean(process.env.PERPLEXITY_API_KEY), category: "search_answer_engine" },
    },
    { slug: "perplexity", displayName: "Perplexity", enabled: true, capabilitiesJson: { live: Boolean(process.env.PERPLEXITY_API_KEY), category: "answer_engine" } },
    {
      slug: "gemini",
      displayName: "Gemini",
      enabled: true,
      capabilitiesJson: { live: Boolean(process.env.PERPLEXITY_API_KEY), category: "llm_answer_engine" },
    },
    {
      slug: "claude",
      displayName: "Claude",
      enabled: true,
      capabilitiesJson: { live: Boolean(process.env.ANTHROPIC_API_KEY), category: "llm_answer_engine" },
    },
  ];
  for (const def of definitions) {
    if (!def.enabled) continue;
    const existing = await db
      .select()
      .from(aiEngines)
      .where(eq(aiEngines.slug, def.slug))
      .limit(1)
      .then((rows) => rows[0] ?? null);
    if (!existing) {
      await db.insert(aiEngines).values({
        slug: def.slug,
        displayName: def.displayName,
        isActive: 1,
        capabilitiesJson: def.capabilitiesJson,
      });
    }
  }
  return definitions.filter((d) => d.enabled).map((d) => d.slug);
}

async function ensureTrackedQueries(clientId: string, orgId: string, websiteUrl: string) {
  const existing = await db
    .select()
    .from(trackedQueries)
    .where(and(eq(trackedQueries.clientId, clientId), eq(trackedQueries.orgId, orgId)));

  if (existing.length > 0) {
    return existing;
  }

  const host = normalizeHost(websiteUrl);
  const brand = host.split(".")[0] ?? "brand";
  const defaults = [
    `best ${brand} services`,
    `${brand} alternatives`,
    `${brand} reviews`,
    `${brand} pricing`,
    `who should use ${brand}`,
  ];

  return db
    .insert(trackedQueries)
    .values(
      defaults.map((queryText, idx) => ({
        clientId,
        orgId,
        queryText,
        intent: idx < 2 ? "commercial" : "informational",
        priority: idx < 2 ? "high" : "medium",
        region: "US",
        language: "en",
        active: 1,
      })),
    )
    .returning();
}

async function ensureActiveSprintAndTasks(clientId: string, orgId: string) {
  const [program] =
    (
      await db
        .select()
        .from(programs)
        .where(and(eq(programs.clientId, clientId), eq(programs.orgId, orgId)))
        .limit(1)
    ).length > 0
      ? await db
          .select()
          .from(programs)
          .where(and(eq(programs.clientId, clientId), eq(programs.orgId, orgId)))
          .limit(1)
      : await db
          .insert(programs)
          .values({
            clientId,
            orgId,
            startDate: new Date().toISOString().slice(0, 10),
            status: "active",
          })
          .returning();

  const monthKey = new Date().toISOString().slice(0, 7);
  const [sprint] =
    (
      await db
        .select()
        .from(sprints)
        .where(and(eq(sprints.programId, program.id), eq(sprints.month, monthKey)))
        .limit(1)
    ).length > 0
      ? await db
          .select()
          .from(sprints)
          .where(and(eq(sprints.programId, program.id), eq(sprints.month, monthKey)))
          .limit(1)
      : await db
          .insert(sprints)
          .values({
            programId: program.id,
            month: monthKey,
            status: "in_progress",
          })
          .returning();

  const existingTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.sprintId, sprint.id));

  if (existingTasks.length === 0) {
    await db.insert(tasks).values([
      {
        sprintId: sprint.id,
        type: "geo_audit",
        title: "Review crawl + GEO audit findings",
        description: "Validate high-priority issues and assign fix owners.",
        status: "in_progress",
        priority: "high",
      },
      {
        sprintId: sprint.id,
        type: "schema",
        title: "Implement generated JSON-LD package",
        description: "Deploy schema bundle to homepage, service, and FAQ pages.",
        status: "backlog",
        priority: "high",
      },
      {
        sprintId: sprint.id,
        type: "visibility",
        title: "Track AI visibility query changes",
        description: "Compare baseline and post-implementation SOV/citations.",
        status: "backlog",
        priority: "medium",
      },
    ]);
  }

  return { programId: program.id, sprintId: sprint.id, seededTasks: existingTasks.length === 0 };
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

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 422 },
    );
  }

  const requestedUrl =
    parsed.data.websiteUrl && parsed.data.websiteUrl.trim().length > 0
      ? normalizeWebsiteUrl(parsed.data.websiteUrl)
      : null;

  let client: typeof clients.$inferSelect | null = null;
  const activeContext = await getActiveClientForOrg(session.currentOrgId);

  if (parsed.data.clientId) {
    client = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, parsed.data.clientId),
          eq(clients.orgId, session.currentOrgId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  if (!client && activeContext.activeClient) {
    client = await db
      .select()
      .from(clients)
      .where(
        and(
          eq(clients.id, activeContext.activeClient.id),
          eq(clients.orgId, session.currentOrgId),
        ),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);
  }

  if (requestedUrl) {
    const byUrl = await db
      .select()
      .from(clients)
      .where(
        and(eq(clients.orgId, session.currentOrgId), eq(clients.websiteUrl, requestedUrl)),
      )
      .limit(1)
      .then((rows) => rows[0] ?? null);

    if (byUrl) {
      client = byUrl;
    } else if (!client || client.websiteUrl !== requestedUrl) {
      const [created] = await db
        .insert(clients)
        .values({
          orgId: session.currentOrgId,
          name: parsed.data.clientName?.trim() || normalizeHost(requestedUrl),
          websiteUrl: requestedUrl,
        })
        .returning();
      client = created;
    }
  }

  if (!client) {
    return NextResponse.json(
      {
        error:
          "No client selected. Provide a website URL so this run is isolated to one website.",
      },
      { status: 404 },
    );
  }

  const auditResult = await runContentAuditForClient(client.id);

  const enabledEngines = await ensureEngines();
  const queries = await ensureTrackedQueries(
    client.id,
    session.currentOrgId,
    client.websiteUrl,
  );

  const queryRuns = [];
  const queryRunFailures: Array<{ queryId: string; engine: string; error: string }> = [];
  for (const query of queries) {
    for (const engineSlug of enabledEngines.length > 0 ? enabledEngines : ["perplexity"]) {
      try {
        const run = await runTrackedQuery(query.id, engineSlug);
        queryRuns.push(run.id);
      } catch (error) {
        queryRunFailures.push({
          queryId: query.id,
          engine: engineSlug,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  const visibilityRows = await aggregateVisibilityMetricsForDay(new Date());
  const sprintSetup = await ensureActiveSprintAndTasks(client.id, session.currentOrgId);

  const geoPack = await buildGeoImplementationPack({
    ...parsed.data,
    clientId: client.id,
    orgId: session.currentOrgId,
    auditRunAt: auditResult.auditRunAt,
  });

  const [summary] = await db
    .insert(deliverables)
    .values({
      clientId: client.id,
      orgId: session.currentOrgId,
      type: "content_piece",
      title: `Full GEO Pipeline Summary ${new Date().toISOString().slice(0, 10)}`,
      description: `Automated crawl, audit, query visibility, and schema package execution for ${client.name}.`,
      status: "in_review",
      contentJson: {
        audit: auditResult,
        trackedQueries: queries.length,
        visibilityMetricRows: visibilityRows,
        geoPackageDeliverableId: geoPack.deliverableId,
        sprintId: sprintSetup.sprintId,
        programId: sprintSetup.programId,
        seededTasks: sprintSetup.seededTasks,
        queryRunIds: queryRuns,
        queryRunFailures,
        queryEngineCount: enabledEngines.length,
      },
    })
    .returning();

  const response = NextResponse.json({
    ok: true,
    clientId: client.id,
    auditedPages: auditResult.auditedPages,
    trackedQueries: queries.length,
    visibilityMetricRows: visibilityRows,
    geoPackageDeliverableId: geoPack.deliverableId,
    sprintId: sprintSetup.sprintId,
    programId: sprintSetup.programId,
    seededTasks: sprintSetup.seededTasks,
    summaryDeliverableId: summary.id,
    queryRunFailures,
    queryEngineCount: enabledEngines.length,
  });
  response.cookies.set(ACTIVE_CLIENT_COOKIE, client.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

