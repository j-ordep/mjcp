import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { users } from "../users/schema.ts";

export const rooms = pgTable(
  "rooms",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    capacity: integer("capacity").default(0).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("rooms_capacity_check", sql`${table.capacity} >= 0`),
  ],
);

export const roomReservations = pgTable(
  "room_reservations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => rooms.id),
    reservedBy: uuid("reserved_by")
      .notNull()
      .references(() => users.id),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    purpose: text("purpose"),
    category: text("category", {
      enum: ["geral", "culto", "ensino", "jovens", "oração", "reunião", "especial"],
    })
      .default("geral")
      .notNull(),
    status: text("status", { enum: ["active", "cancelled"] })
      .default("active")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("room_reservations_end_after_start", sql`${table.endAt} > ${table.startAt}`),
    check("room_reservations_status_check", sql`${table.status} IN ('active', 'cancelled')`),
    check(
      "room_reservations_category_check",
      sql`${table.category} IN ('geral', 'culto', 'ensino', 'jovens', 'oração', 'reunião', 'especial')`,
    ),
    index("room_reservations_room_start_idx").on(table.roomId, table.startAt),
    // EXCLUDE is defined in drizzle/0001_room_reservations_no_overlap.sql.
    // Drizzle 0.44 has no EXCLUDE builder; apply the versioned SQL migrations
    // to enforce non-overlapping active reservations. This index is for queries.
  ],
);
