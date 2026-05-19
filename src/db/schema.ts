import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const eventKindEnum = pgEnum("event_kind", ["timed", "all_day"]);

export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("admin_users_email_idx").on(table.email)]
);

export const calendars = pgTable(
  "calendars",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 120 }).notNull(),
    slug: varchar("slug", { length: 120 }).notNull(),
    color: varchar("color", { length: 32 }).notNull().default("#7c3aed"),
    timezone: varchar("timezone", { length: 80 })
      .notNull()
      .default("Europe/Sofia"),
    isArchived: boolean("is_archived").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("calendars_slug_idx").on(table.slug)]
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    calendarId: uuid("calendar_id")
      .notNull()
      .references(() => calendars.id, { onDelete: "cascade" }),
    kind: eventKindEnum("kind").notNull(),
    title: varchar("title", { length: 180 }).notNull(),
    description: text("description"),
    location: varchar("location", { length: 240 }),
    startsAt: timestamp("starts_at", { withTimezone: true, mode: "date" }),
    endsAt: timestamp("ends_at", { withTimezone: true, mode: "date" }),
    allDayStart: date("all_day_start", { mode: "string" }),
    allDayEnd: date("all_day_end", { mode: "string" }),
    timezone: varchar("timezone", { length: 80 })
      .notNull()
      .default("Europe/Sofia"),
    sequence: integer("sequence").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("events_calendar_idx").on(table.calendarId),
    index("events_timed_window_idx").on(table.startsAt, table.endsAt),
    index("events_all_day_window_idx").on(table.allDayStart, table.allDayEnd),
  ]
);

export const subscriptionLinks = pgTable(
  "subscription_links",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    calendarId: uuid("calendar_id")
      .notNull()
      .references(() => calendars.id, { onDelete: "cascade" }),
    label: varchar("label", { length: 120 }).notNull(),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("subscription_links_calendar_idx").on(table.calendarId),
    uniqueIndex("subscription_links_token_hash_idx").on(table.tokenHash),
  ]
);

export type Calendar = typeof calendars.$inferSelect;
export type Event = typeof events.$inferSelect;
export type SubscriptionLink = typeof subscriptionLinks.$inferSelect;
