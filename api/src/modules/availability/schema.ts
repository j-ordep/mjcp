import { date, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { users } from "../users/schema.ts";

// Preserve the current whole-day unavailability model. Partial-day periods
// need a separate product decision; a date is not a UTC timestamp.
export const blockedDates = pgTable(
  "blocked_dates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    date: date("date", { mode: "string" }).notNull(),
    reason: text("reason"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("blocked_dates_user_date_unique").on(table.userId, table.date),
  ],
);
