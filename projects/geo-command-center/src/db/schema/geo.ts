import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  numeric,
  date,
} from "drizzle-orm/pg-core";

import { clients } from "./core";

export const aiEngines = pgTable("ai_engines", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  displayName: text("display_name").notNull(),
  isActive: integer("is_active").notNull().default(1),
  capabilitiesJson: jsonb("capabilities_json").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const trackedQueries = pgTable("tracked_queries", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").notNull(),
  queryText: text("query_text").notNull(),
  intent: text("intent"),
  priority: text("priority"),
  region: text("region"),
  language: text("language"),
  active: integer("active").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const engineRunStatusEnum = pgEnum("engine_run_status", [
  "pending",
  "completed",
  "failed",
]);

export const engineRuns = pgTable("engine_runs", {
  id: uuid("id").primaryKey().defaultRandom(),
  trackedQueryId: uuid("tracked_query_id")
    .notNull()
    .references(() => trackedQueries.id, { onDelete: "cascade" }),
  engineId: uuid("engine_id")
    .notNull()
    .references(() => aiEngines.id, { onDelete: "cascade" }),
  runTime: timestamp("run_time", { withTimezone: true }).notNull(),
  rawResponse: jsonb("raw_response").$type<unknown>(),
  citationsJson: jsonb("citations").$type<unknown>(),
  mentionedBrands: jsonb("mentioned_brands").$type<string[] | null>().default(
    null,
  ),
  confidence: numeric("confidence", { precision: 4, scale: 3 }),
  durationMs: integer("duration_ms"),
  status: engineRunStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const citations = pgTable("citations", {
  id: uuid("id").primaryKey().defaultRandom(),
  engineRunId: uuid("engine_run_id")
    .notNull()
    .references(() => engineRuns.id, { onDelete: "cascade" }),
  citedDomain: text("cited_domain").notNull(),
  citedUrl: text("cited_url").notNull(),
  snippet: text("snippet"),
  positionWeight: numeric("position_weight", { precision: 4, scale: 3 }),
  rank: integer("rank"),
});

export const visibilityMetricsDaily = pgTable("visibility_metrics_daily", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  engineId: uuid("engine_id")
    .notNull()
    .references(() => aiEngines.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  shareOfVoice: numeric("share_of_voice", { precision: 5, scale: 2 }),
  citationCount: integer("citation_count").notNull().default(0),
  mentionCount: integer("mention_count").notNull().default(0),
  avgPositionWeight: numeric("avg_position_weight", {
    precision: 4,
    scale: 3,
  }),
  competitorShareJson: jsonb("competitor_share_json").$type<
    Record<string, unknown>
  >(),
});

export const artifacts = pgTable("artifacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  engineRunId: uuid("engine_run_id")
    .notNull()
    .references(() => engineRuns.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // e.g. screenshot, raw_html
  storagePath: text("storage_path").notNull(),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

