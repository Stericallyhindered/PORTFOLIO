import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
} from "drizzle-orm/pg-core";

import { organizations } from "./core";

export const plans = pgTable("plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  maxQueries: integer("max_queries"),
  maxEngines: integer("max_engines"),
  maxSeats: integer("max_seats"),
  priceCents: integer("price_cents"),
  billingInterval: text("billing_interval").notNull(), // monthly, yearly
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  planId: uuid("plan_id")
    .notNull()
    .references(() => plans.id, { onDelete: "restrict" }),
  stripeSubscriptionId: text("stripe_subscription_id").notNull().unique(),
  status: text("status").notNull(),
  seatsPurchased: integer("seats_purchased"),
  seatsUsed: integer("seats_used"),
  startedAt: timestamp("started_at", { withTimezone: true }),
  renewsAt: timestamp("renews_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const apiTokens = pgTable("api_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  label: text("label").notNull(),
  scopes: text("scopes").notNull(), // comma-separated scopes, read-only
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
});

