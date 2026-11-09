import { sql } from "drizzle-orm";
import { check, foreignKey, index, integer, pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";

import { scheduleOccurrences } from "../schedules/schema.ts";
import { users } from "../users/schema.ts";

export const songs = pgTable(
  "songs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    title: text("title").notNull(),
    artist: text("artist"),
    key: text("key"),
    bpm: integer("bpm"),
    category: text("category", { enum: ["louvor", "adoracao", "infantil", "outro"] }),
    lyricsUrl: text("lyrics_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "songs_category_check",
      sql`${table.category} IS NULL OR ${table.category} IN ('louvor', 'adoracao', 'infantil', 'outro')`,
    ),
  ],
);

export const songSingerPreferences = pgTable(
  "song_singer_preferences",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    singerUserId: uuid("singer_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    preferredKey: text("preferred_key").notNull(),
  },
  (table) => [
    unique("song_singer_preferences_song_singer_unique").on(table.songId, table.singerUserId),
    index("song_singer_preferences_singer_idx").on(table.singerUserId),
  ],
);

// Each row is an item of an occurrence's repertoire; no separate 1:1 header
// table is needed. A preference is copied to songKey when choosing the item;
// later preference changes must not rewrite the historical execution.
export const scheduleOccurrenceSetlistItems = pgTable(
  "schedule_occurrence_setlist_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    occurrenceId: uuid("occurrence_id").notNull(),
    songId: uuid("song_id")
      .notNull()
      .references(() => songs.id),
    position: integer("position").notNull(),
    singerUserId: uuid("singer_user_id").references(() => users.id),
    songKey: text("song_key"),
  },
  (table) => [
    foreignKey({
      name: "setlist_items_occurrence_fk",
      columns: [table.occurrenceId],
      foreignColumns: [scheduleOccurrences.id],
    }),
    unique("setlist_items_occurrence_song_unique").on(table.occurrenceId, table.songId),
    unique("setlist_items_occurrence_position_unique").on(table.occurrenceId, table.position),
    check("setlist_items_position_check", sql`${table.position} >= 0`),
    // Singer eligibility and permission to edit the worship repertoire
    // belong to the authorized operation, not the public request body.
  ],
);
