import "server-only";

import { cookies } from "next/headers";
import { z } from "zod";

import { db } from "@/db/client";
import { memberships, organizations, users as appUsers } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Role } from "./roles";
import { isOpenAccessMode } from "@/lib/config";

export const SessionUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().nullable().optional(),
});

export type SessionUser = z.infer<typeof SessionUserSchema>;

export type MembershipSummary = {
  orgId: string;
  orgName: string;
  role: Role;
};

export type SessionContext = {
  user: SessionUser;
  currentOrgId: string | null;
  rolesByOrg: Record<string, Role>;
  memberships: MembershipSummary[];
};

const SessionCookieSchema = z.object({
  currentOrgId: z.string().uuid(),
});

export async function getSessionContext(): Promise<SessionContext | null> {
  if (isOpenAccessMode()) {
    const envOrgId =
      process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ??
      process.env.DEFAULT_ORG_ID ??
      "00000000-0000-0000-0000-000000000000";
    const envOrgName = process.env.NEXT_PUBLIC_APP_NAME ?? "Open Access Org";

    return {
      user: {
        id: "00000000-0000-0000-0000-000000000000",
        email: "open-access@geo.local",
        name: "Open Access User",
      },
      currentOrgId: envOrgId,
      rolesByOrg: {
        [envOrgId]: "super_admin",
      },
      memberships: [
        {
          orgId: envOrgId,
          orgName: envOrgName,
          role: "super_admin",
        },
      ],
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }

  const user = SessionUserSchema.parse({
    id: session.user.id,
    email: session.user.email,
    name: session.user.user_metadata?.full_name ?? null,
  });

  // Ensure we have an application user record linked to the Supabase auth user.
  const existingAppUser = await db.query.users.findFirst({
    where: (u, { eq }) => eq(u.authUserId, session.user.id),
  });

  const appUser =
    existingAppUser ??
    (
      await db
        .insert(appUsers)
        .values({
          authUserId: user.id,
          email: user.email,
          name: session.user.user_metadata?.full_name ?? null,
        })
        .returning()
    )[0];

  const dbMemberships = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, appUser.id));

  let membershipSummaries: MembershipSummary[] = [];

  if (dbMemberships.length > 0) {
    const orgIds = dbMemberships.map((m) => m.orgId);
    const orgRows = await db
      .select()
      .from(organizations)
      .where(inArray(organizations.id, orgIds));

    membershipSummaries = dbMemberships.map((m) => {
      const org = orgRows.find((o) => o.id === m.orgId);
      return {
        orgId: m.orgId,
        orgName: org?.name ?? "Organization",
        role: m.role as Role,
      };
    });
  }

  const cookieStore = await cookies();
  const rawSessionCookie = cookieStore.get("gcc_session")?.value;

  const parsedCookie = rawSessionCookie
    ? SessionCookieSchema.safeParse(JSON.parse(rawSessionCookie))
    : null;

  const membershipOrgIds = new Set(membershipSummaries.map((m) => m.orgId));

  let currentOrgId: string | null = null;

  if (
    parsedCookie?.success === true &&
    membershipOrgIds.has(parsedCookie.data.currentOrgId)
  ) {
    currentOrgId = parsedCookie.data.currentOrgId;
  } else if (membershipSummaries[0]) {
    currentOrgId = membershipSummaries[0].orgId;
  }

  const rolesByOrg: Record<string, Role> = {};
  membershipSummaries.forEach((m) => {
    rolesByOrg[m.orgId] = m.role;
  });

  return {
    user,
    currentOrgId,
    rolesByOrg,
    memberships: membershipSummaries,
  };
}

