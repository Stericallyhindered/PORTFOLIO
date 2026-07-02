import { and, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { plans, subscriptions, trackedQueries, memberships, aiEngines } from "@/db/schema";

export type PlanUsageSummary = {
  maxQueries: number | null;
  maxEngines: number | null;
  maxSeats: number | null;
  currentQueries: number;
  currentSeats: number;
  currentEngines: number;
};

export async function getPlanUsageSummary(orgId: string): Promise<PlanUsageSummary> {
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.orgId, orgId))
    .limit(1)
    .then((rows) => rows[0] ?? null);

  const plan =
    subscription == null
      ? null
      : await db
          .select()
          .from(plans)
          .where(eq(plans.id, subscription.planId))
          .limit(1)
          .then((rows) => rows[0] ?? null);

  const [queryCountRows, seatRows, enginesRows] = await Promise.all([
    db.select().from(trackedQueries).where(eq(trackedQueries.orgId, orgId)),
    db.select().from(memberships).where(eq(memberships.orgId, orgId)),
    db.select().from(aiEngines).where(eq(aiEngines.isActive, 1)),
  ]);

  return {
    maxQueries: plan?.maxQueries ?? null,
    maxEngines: plan?.maxEngines ?? null,
    maxSeats: plan?.maxSeats ?? null,
    currentQueries: queryCountRows.length,
    currentSeats: seatRows.length,
    currentEngines: enginesRows.length,
  };
}

export async function enforcePlanLimit(
  orgId: string,
  key: "queries" | "engines" | "seats",
): Promise<{ allowed: boolean; reason?: string }> {
  const usage = await getPlanUsageSummary(orgId);

  if (key === "queries" && usage.maxQueries != null && usage.currentQueries >= usage.maxQueries) {
    return { allowed: false, reason: "Query limit reached for plan" };
  }
  if (key === "engines" && usage.maxEngines != null && usage.currentEngines >= usage.maxEngines) {
    return { allowed: false, reason: "Engine limit reached for plan" };
  }
  if (key === "seats" && usage.maxSeats != null && usage.currentSeats >= usage.maxSeats) {
    return { allowed: false, reason: "Seat limit reached for plan" };
  }

  return { allowed: true };
}

