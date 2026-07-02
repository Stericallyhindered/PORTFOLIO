import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
} from "drizzle-orm/pg-core";

export const orgTypeEnum = pgEnum("org_type", ["agency", "client"]);

export const roleEnum = pgEnum("role", [
  "super_admin",
  "agency_admin",
  "strategist",
  "writer",
  "analyst",
  "client_admin",
  "client_viewer",
]);

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: orgTypeEnum("type").notNull(),
  billingTier: text("billing_tier"),
  stripeCustomerId: text("stripe_customer_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authUserId: uuid("auth_user_id").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const memberships = pgTable("memberships", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const membershipsOrgUserUnique = {
  unique: ["user_id", "org_id"] as const,
};

export const clients = pgTable("clients", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  clientOrgId: uuid("client_org_id").references(() => organizations.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  industry: text("industry"),
  websiteUrl: text("website_url").notNull(),
  regions: jsonb("regions").$type<string[] | null>().default(null),
  competitors: jsonb("competitors").$type<string[] | null>().default(null),
  activeProgramId: uuid("active_program_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const integrationTypeEnum = pgEnum("integration_type", [
  "ga4",
  "gsc",
  "ahrefs",
  "semrush",
  "cms",
]);

export const integrations = pgTable("integrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  type: integrationTypeEnum("type").notNull(),
  status: text("status").notNull().default("inactive"),
  configJson: jsonb("config_json").$type<Record<string, unknown>>(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const brandEntities = pgTable("brand_entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  entityName: text("entity_name").notNull(),
  entityType: text("entity_type").notNull(),
  aliases: jsonb("aliases").$type<string[] | null>().default(null),
  knowledgeSources: jsonb("knowledge_sources").$type<string[] | null>().default(
    null,
  ),
  canonicalUrl: text("canonical_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const competitorEntities = pgTable("competitor_entities", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  entityName: text("entity_name").notNull(),
  entityType: text("entity_type").notNull(),
  aliases: jsonb("aliases").$type<string[] | null>().default(null),
  canonicalUrl: text("canonical_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

