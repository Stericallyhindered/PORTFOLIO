import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

import { clients } from "./core";
import { engineRuns } from "./geo";

export const pages = pgTable("pages", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").notNull(),
  url: text("url").notNull(),
  pageType: text("page_type"),
  topicCluster: text("topic_cluster"),
  lastCrawledAt: timestamp("last_crawled_at", { withTimezone: true }),
  lastUpdatedAt: timestamp("last_updated_at", { withTimezone: true }),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const contentAudits = pgTable("content_audits", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  auditDate: timestamp("audit_date", { withTimezone: true }).notNull(),
  issuesJson: jsonb("issues_json").$type<unknown>(),
  recommendationsJson: jsonb("recommendations_json").$type<unknown>(),
  score: integer("score"),
  frameworkVersion: text("framework_version"),
  runConfidence: integer("run_confidence"),
  dimensionScoresJson: jsonb("dimension_scores_json").$type<unknown>(),
  subDimensionScoresJson: jsonb("sub_dimension_scores_json").$type<unknown>(),
  modelJudgmentJson: jsonb("model_judgment_json").$type<unknown>(),
  engineEvidenceJson: jsonb("engine_evidence_json").$type<unknown>(),
  currentVsImprovedJson: jsonb("current_vs_improved_json").$type<unknown>(),
  engineRunId: uuid("engine_run_id").references(() => engineRuns.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const schemaStatusEnum = pgEnum("schema_status", [
  "proposed",
  "in_progress",
  "implemented",
]);

export const schemaRecommendations = pgTable("schema_recommendations", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  schemaType: text("schema_type").notNull(),
  jsonLd: text("json_ld").notNull(),
  status: schemaStatusEnum("status").notNull().default("proposed"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const briefStatusEnum = pgEnum("brief_status", [
  "draft",
  "in_review",
  "approved",
  "archived",
]);

export const contentBriefs = pgTable("content_briefs", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  targetQueries: jsonb("target_queries").$type<string[] | null>().default(null),
  entities: jsonb("entities").$type<string[] | null>().default(null),
  outline: jsonb("outline").$type<Record<string, unknown>>(),
  referencesJson: jsonb("references").$type<string[] | null>().default(null),
  status: briefStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const deliverableTypeEnum = pgEnum("deliverable_type", [
  "monthly_report",
  "content_piece",
  "pr_pitch",
  "schema_update",
  "tech_fix",
]);

export const deliverableStatusEnum = pgEnum("deliverable_status", [
  "planned",
  "in_progress",
  "in_review",
  "approved",
  "shipped",
]);

export const deliverables = pgTable("deliverables", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").notNull(),
  type: deliverableTypeEnum("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sprintId: uuid("sprint_id"),
  contentJson: jsonb("content_json").$type<Record<string, unknown>>(),
  status: deliverableStatusEnum("status").notNull().default("planned"),
  storagePath: text("storage_path"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const pageEntityScores = pgTable("page_entity_scores", {
  id: uuid("id").primaryKey().defaultRandom(),
  pageId: uuid("page_id")
    .notNull()
    .references(() => pages.id, { onDelete: "cascade" }),
  entityId: uuid("entity_id").notNull(),
  score: integer("score").notNull(),
  evidence: jsonb("evidence").$type<unknown>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

