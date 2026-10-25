import { sql } from "drizzle-orm";
import {
  check,
  foreignKey,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { ministries, ministryPositions } from "../ministries/schema.ts";
import { users } from "../users/schema.ts";

export const schedules = pgTable(
  "schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    ministryId: uuid("ministry_id")
      .notNull()
      .references(() => ministries.id),

    title: text("title"),

    startAt: timestamp("start_at", { withTimezone: true }).notNull(),

    endAt: timestamp("end_at", { withTimezone: true }),

    notes: text("notes"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "schedules_end_after_start",
      sql`${table.endAt} IS NULL OR ${table.endAt} > ${table.startAt}`,
    ),
    unique("schedules_id_ministry_unique").on(table.id, table.ministryId),
    // This only prevents equal starts. General overlap still needs an
    // exclusion constraint and a decision about schedules without an end.
    unique("schedules_ministry_start_unique").on(table.ministryId, table.startAt),
  ],
);

export const scheduleAssignments = pgTable(
  "schedule_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scheduleId: uuid("schedule_id").notNull(),
    ministryId: uuid("ministry_id").notNull(),
    // Keep the user reference independent of current ministry membership so
    // removing a member or capability does not remove historical assignments.
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    positionId: uuid("position_id").notNull(),
    status: text("status", { enum: ["pending", "confirmed", "declined", "swapped"] })
      .default("pending")
      .notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("assignments_schedule_user_unique").on(table.scheduleId, table.userId),
    unique("assignments_id_schedule_unique").on(table.id, table.scheduleId),
    foreignKey({
      name: "assignments_schedule_ministry_fk",
      columns: [table.scheduleId, table.ministryId],
      foreignColumns: [schedules.id, schedules.ministryId],
    }),
    foreignKey({
      name: "assignments_position_ministry_fk",
      columns: [table.positionId, table.ministryId],
      foreignColumns: [ministryPositions.id, ministryPositions.ministryId],
    }),
    check(
      "assignments_status_check",
      sql`${table.status} IN ('pending', 'confirmed', 'declined', 'swapped')`,
    ),
    index("assignments_user_status_idx").on(table.userId, table.status),
    // Current membership/capability and the start-time lock require a
    // transactional operation and database enforcement when writes are added.
  ],
);

export const swapRequests = pgTable(
  "swap_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    assignmentId: uuid("assignment_id").notNull(),
    scheduleId: uuid("schedule_id").notNull(),
    // Preserve the original requester when known. Completed legacy requests
    // may have no recoverable author; new pending requests require one below.
    requesterUserId: uuid("requester_user_id").references(() => users.id),
    acceptedByUserId: uuid("accepted_by_user_id").references(() => users.id),
    reason: text("reason"),
    // Keep legacy values for migration. "approved" means assumed by an
    // eligible member, not leader approval; "rejected" preserves old history.
    status: text("status", { enum: ["pending", "approved", "rejected", "cancelled"] })
      .default("pending")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: "swap_requests_assignment_schedule_fk",
      columns: [table.assignmentId, table.scheduleId],
      foreignColumns: [scheduleAssignments.id, scheduleAssignments.scheduleId],
    }),
    uniqueIndex("swaps_one_pending_per_assignment")
      .on(table.assignmentId)
      .where(sql`${table.status} = 'pending'`),
    check(
      "swap_requests_status_check",
      sql`${table.status} IN ('pending', 'approved', 'rejected', 'cancelled')`,
    ),
    check(
      "swap_requests_resolution_check",
      sql`(
        ${table.status} = 'pending'
        AND ${table.requesterUserId} IS NOT NULL
        AND ${table.acceptedByUserId} IS NULL
        AND ${table.resolvedAt} IS NULL
      ) OR (
        ${table.status} = 'approved'
        AND ${table.acceptedByUserId} IS NOT NULL
        AND (${table.requesterUserId} IS NULL OR ${table.acceptedByUserId} <> ${table.requesterUserId})
        AND ${table.resolvedAt} IS NOT NULL
      ) OR (
        ${table.status} IN ('cancelled', 'rejected')
        AND ${table.acceptedByUserId} IS NULL
        AND ${table.resolvedAt} IS NOT NULL
      )`,
    ),
    index("swap_requests_requester_idx").on(table.requesterUserId),
    // Ownership, immutable requester, eligibility, time lock and a single
    // winning acceptance still need the transactional database operation.
  ],
);
