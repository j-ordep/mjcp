import { sql } from "drizzle-orm";
import {
  check,
  date,
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

// A monthly plan groups occurrences. Ownership and publication operations
// must be authorized by the API; these columns alone do not enforce access.
export const schedulePlans = pgTable(
  "schedule_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ministryId: uuid("ministry_id")
      .notNull()
      .references(() => ministries.id),
    referenceMonth: date("reference_month", { mode: "string" }).notNull(),
    createdByUserId: uuid("created_by_user_id")
      .notNull()
      .references(() => users.id),
    status: text("status", { enum: ["draft", "published"] })
      .default("draft")
      .notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("schedule_plans_ministry_month_unique").on(table.ministryId, table.referenceMonth),
    unique("schedule_plans_id_ministry_unique").on(table.id, table.ministryId),
    check(
      "schedule_plans_month_first_day",
      sql`EXTRACT(DAY FROM ${table.referenceMonth}) = 1`,
    ),
    check(
      "schedule_plans_status_check",
      sql`${table.status} IN ('draft', 'published')`,
    ),
    check(
      "schedule_plans_publication_check",
      sql`(
        ${table.status} = 'draft' AND ${table.publishedAt} IS NULL
      ) OR (
        ${table.status} = 'published' AND ${table.publishedAt} IS NOT NULL
      )`,
    ),
    index("schedule_plans_author_idx").on(table.createdByUserId),
  ],
);

export const scheduleOccurrences = pgTable(
  "schedule_occurrences",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    planId: uuid("plan_id").notNull(),

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
    foreignKey({
      name: "occurrences_plan_ministry_fk",
      columns: [table.planId, table.ministryId],
      foreignColumns: [schedulePlans.id, schedulePlans.ministryId],
    }),
    check(
      "occurrences_end_after_start",
      sql`${table.endAt} IS NULL OR ${table.endAt} > ${table.startAt}`,
    ),
    unique("occurrences_id_ministry_unique").on(table.id, table.ministryId),
    // This only prevents equal starts, including in drafts. Published-period
    // overlap, the 60-minute fallback and month consistency need the write operation
    // and further database protection before exposing the API.
    unique("occurrences_ministry_start_unique").on(table.ministryId, table.startAt),
  ],
);

export const scheduleOccurrenceAssignments = pgTable(
  "schedule_occurrence_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    occurrenceId: uuid("occurrence_id").notNull(),
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
    unique("assignments_occurrence_user_unique").on(table.occurrenceId, table.userId),
    unique("assignments_id_occurrence_unique").on(table.id, table.occurrenceId),
    foreignKey({
      name: "assignments_occurrence_ministry_fk",
      columns: [table.occurrenceId, table.ministryId],
      foreignColumns: [scheduleOccurrences.id, scheduleOccurrences.ministryId],
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
    occurrenceId: uuid("occurrence_id").notNull(),
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
      name: "swap_requests_assignment_occurrence_fk",
      columns: [table.assignmentId, table.occurrenceId],
      foreignColumns: [scheduleOccurrenceAssignments.id, scheduleOccurrenceAssignments.occurrenceId],
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
