import "dotenv/config";

import { db } from "@/db/client";
import {
  organizations,
  users,
  memberships,
  clients,
  aiEngines,
  trackedQueries,
  programs,
  sprints,
  tasks,
  deliverables,
} from "@/db/schema";

async function main() {
  console.log("Seeding GEO Command Center demo data...");

  const [agencyOrg] = await db
    .insert(organizations)
    .values({
      name: "Demo GEO Agency",
      type: "agency",
      billingTier: "enterprise",
    })
    .returning();

  const [clientOrg] = await db
    .insert(organizations)
    .values({
      name: "Demo Client Co",
      type: "client",
    })
    .returning();

  const [user] = await db
    .insert(users)
    .values({
      authUserId: crypto.randomUUID(),
      email: "founder@demo-geo-agency.test",
      name: "Agency Founder",
    })
    .returning();

  await db.insert(memberships).values({
    userId: user.id,
    orgId: agencyOrg.id,
    role: "super_admin",
  });

  const [client] = await db
    .insert(clients)
    .values({
      orgId: agencyOrg.id,
      clientOrgId: clientOrg.id,
      name: "Demo Client Co",
      industry: "B2B SaaS",
      websiteUrl: "https://example.com",
      regions: ["US"],
      competitors: ["openai.com", "anthropic.com"],
    })
    .returning();

  const [perplexityEngine] = await db
    .insert(aiEngines)
    .values({
      slug: "perplexity",
      displayName: "Perplexity",
      isActive: 1,
    })
    .returning();

  const [query] = await db
    .insert(trackedQueries)
    .values({
      clientId: client.id,
      orgId: agencyOrg.id,
      queryText: "best GEO agency for AI visibility",
      intent: "commercial",
      priority: "high",
      region: "US",
      language: "en",
    })
    .returning();

  const [program] = await db
    .insert(programs)
    .values({
      clientId: client.id,
      orgId: agencyOrg.id,
      startDate: new Date().toISOString().slice(0, 10),
      status: "active",
    })
    .returning();

  const monthKey = new Date().toISOString().slice(0, 7);

  const [sprint] = await db
    .insert(sprints)
    .values({
      programId: program.id,
      month: monthKey,
    })
    .returning();

  await db.insert(tasks).values([
    {
      sprintId: sprint.id,
      type: "content",
      title: "Audit key GEO landing pages",
      description: "Baseline audit for top 10 pages impacting AI visibility.",
      priority: "high",
      status: "in_progress",
    },
    {
      sprintId: sprint.id,
      type: "monitoring",
      title: "Run Perplexity visibility baseline",
      description:
        "Capture current citations and mentions for core queries in Perplexity.",
      priority: "high",
      status: "backlog",
    },
  ]);

  await db.insert(deliverables).values({
    clientId: client.id,
    orgId: agencyOrg.id,
    type: "monthly_report",
    title: `Monthly GEO Report ${monthKey}`,
    description: "Demo monthly report with sample visibility and work log.",
    status: "planned",
  });

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

