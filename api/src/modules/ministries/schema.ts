import {
  boolean,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import { users } from "../users/schema.ts";

export const ministries = pgTable("ministries", {
  id: uuid("id").defaultRandom().primaryKey(),

  name: text("name").notNull().unique(),

  description: text("description"),

  color: text("color").default("#000000"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const ministryPositions = pgTable(
  "ministry_positions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ministryId: uuid("ministry_id")
      .notNull()
      .references(() => ministries.id),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("ministry_positions_ministry_name_unique").on(table.ministryId, table.name),
    // Composite target lets other tables enforce that the position belongs to
    // the same ministry as the member or schedule.
    unique("ministry_positions_id_ministry_unique").on(table.id, table.ministryId),
  ],
);

export const ministryMembers = pgTable(
  "ministry_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ministryId: uuid("ministry_id")
      .notNull()
      .references(() => ministries.id),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    isLeader: boolean("is_leader").default(false).notNull(),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("ministry_members_ministry_user_unique").on(table.ministryId, table.userId),
    unique("ministry_members_id_ministry_unique").on(table.id, table.ministryId),
    index("ministry_members_user_idx").on(table.userId),
  ],
);

export const ministryMemberCapabilities = pgTable(
  "ministry_member_capabilities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    memberId: uuid("member_id").notNull(),
    positionId: uuid("position_id").notNull(),
    ministryId: uuid("ministry_id").notNull(),
  },
  (table) => [
    unique("ministry_member_capabilities_member_position_unique").on(table.memberId, table.positionId),
    foreignKey({
      name: "capabilities_member_ministry_fk",
      columns: [table.memberId, table.ministryId],
      foreignColumns: [ministryMembers.id, ministryMembers.ministryId],
    }).onDelete("cascade"),
    foreignKey({
      name: "capabilities_position_ministry_fk",
      columns: [table.positionId, table.ministryId],
      foreignColumns: [ministryPositions.id, ministryPositions.ministryId],
    }).onDelete("cascade"),
    index("ministry_member_capabilities_position_idx").on(table.positionId),
   ],
);
