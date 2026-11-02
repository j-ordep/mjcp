import { sql } from "drizzle-orm";
import { boolean, check, index, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "../users/schema.ts";

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body"),
    type: text("type", { enum: ["schedule", "swap_request", "room", "general"] }).notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().default({}),
    read: boolean("read").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "notifications_type_check",
      sql`${table.type} IN ('schedule', 'swap_request', 'room', 'general')`,
    ),
    index("notifications_user_read_created_idx").on(table.userId, table.read, table.createdAt.desc()),
    // Delivery, recipients and payload validation are separate operations.
    // Future payloads identify schedules/swap requests, without event links.
  ],
);
