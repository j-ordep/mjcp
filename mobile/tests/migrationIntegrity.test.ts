import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260520000127_add_temporal_integrity_constraints.sql",
);

const scheduleNotificationMigrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260522000128_add_schedule_assignment_notifications.sql",
);

test("temporal integrity migration constrains event and room reservation ranges", () => {
  assert.equal(existsSync(migrationPath), true);

  const migration = readFileSync(migrationPath, "utf8");

  assert.match(
    migration,
    /ALTER\s+TABLE\s+public\.events[\s\S]+ADD\s+CONSTRAINT\s+events_end_after_start_check[\s\S]+CHECK\s*\(\s*end_at\s+IS\s+NULL\s+OR\s+end_at\s*>\s*start_at\s*\)/i,
  );
  assert.match(
    migration,
    /ALTER\s+TABLE\s+public\.room_reservations[\s\S]+ADD\s+CONSTRAINT\s+room_reservations_end_after_start_check[\s\S]+CHECK\s*\(\s*end_at\s*>\s*start_at\s*\)/i,
  );
});

test("schedule notification migration creates a notify-on-insert trigger for schedule assignments", () => {
  assert.equal(existsSync(scheduleNotificationMigrationPath), true);

  const migration = readFileSync(scheduleNotificationMigrationPath, "utf8");

  assert.match(
    migration,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.notify_schedule_assignment_created\s*\(\s*p_assignment_id\s+UUID\s*\)/i,
  );
  assert.match(
    migration,
    /CREATE\s+TRIGGER\s+schedule_assignments_notify_created[\s\S]+AFTER\s+INSERT\s+ON\s+public\.schedule_assignments/i,
  );
  assert.match(
    migration,
    /INSERT\s+INTO\s+public\.notifications\s*\([\s\S]*type[\s\S]*\)[\s\S]*'schedule'/i,
  );
  assert.doesNotMatch(
    migration,
    /CREATE\s+TRIGGER\s+schedule_assignments_notify_[\s\S]+AFTER\s+UPDATE\s+ON\s+public\.schedule_assignments/i,
  );
});
