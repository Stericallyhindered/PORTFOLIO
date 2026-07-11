import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  date,
} from "drizzle-orm/pg-core";

import { clients, memberships } from "./core";
import { deliverables } from "./content";

export const cadenceEnum = pgEnum("cadence", ["monthly"]);

export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  orgId: uuid("org_id").notNull(),
  startDate: date("start_date").notNull(),
  cadence: cadenceEnum("cadence").notNull().default("monthly"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const sprints = pgTable("sprints", {
  id: uuid("id").primaryKey().defaultRandom(),
  programId: uuid("program_id")
    .notNull()
    .references(() => programs.id, { onDelete: "cascade" }),
  month: text("month").notNull(), // YYYY-MM
  goals: jsonb("goals").$type<Record<string, unknown>>(),
  status: text("status").notNull().default("planned"),
  visibilitySnapshotId: uuid("visibility_snapshot_id"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const taskStatusEnum = pgEnum("task_status", [
  "backlog",
  "in_progress",
  "in_review",
  "blocked",
  "done",
]);

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  sprintId: uuid("sprint_id")
    .notNull()
    .references(() => sprints.id, { onDelete: "cascade" }),
  assigneeMembershipId: uuid("assignee_membership_id").references(
    () => memberships.id,
    { onDelete: "set null" },
  ),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: date("due_date"),
  status: taskStatusEnum("status").notNull().default("backlog"),
  blockers: text("blockers"),
  links: jsonb("links").$type<string[] | null>().default(null),
  priority: text("priority"),
  slaDate: date("sla_date"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const taskTemplates = pgTable("task_templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  industry: text("industry").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  defaultDueOffsetDays: text("default_due_offset_days"),
  defaultRole: text("default_role"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  deliverableId: uuid("deliverable_id")
    .notNull()
    .references(() => deliverables.id, { onDelete: "cascade" }),
  clientUserId: uuid("client_user_id"),
  status: approvalStatusEnum("status").notNull().default("pending"),
  comments: text("comments"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const notes = pgTable("notes", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => clients.id, { onDelete: "cascade" }),
  authorMembershipId: uuid("author_membership_id").references(
    () => memberships.id,
    { onDelete: "set null" },
  ),
  category: text("category").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

