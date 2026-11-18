import { sql } from "drizzle-orm";
import {
  check,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// Identification and profile share one row. Credentials and sessions are not
// modeled here; this table alone does not implement authentication.
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fullName: text("full_name"),
    email: text("email"),
    phone: text("phone"),
    avatarUrl: text("avatar_url"),
    // Access controls administration in the current single-church model.
    // Ministry leadership belongs only to ministry_members.is_leader.
    accessRole: text("access_role", { enum: ["admin", "member"] })
      .default("member")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    // defaultNow initializes this value; later writes must update it explicitly.
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(sql`lower(${table.email})`),
    check(
      "users_access_role_check",
      sql`${table.accessRole} IN ('admin', 'member')`,
    ),
  ],
);
