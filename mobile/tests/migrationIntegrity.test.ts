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
