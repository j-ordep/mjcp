import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const hardenEventWritesMigrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260716000129_harden_event_writes.sql",
);

const hardenMemberProfileMigrationPath = join(
  process.cwd(),
  "supabase",
  "migrations",
  "20260716000130_harden_member_profile_access.sql",
);

test("event write hardening migration locks event edits and creates atomic batch rpc", () => {
  assert.equal(existsSync(hardenEventWritesMigrationPath), true);

  const migration = readFileSync(hardenEventWritesMigrationPath, "utf8");

  assert.match(
    migration,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.save_event_with_optional_room_reservation\s*\(/i,
  );
  assert.match(
    migration,
    /SELECT[\s\S]+INTO\s+v_existing_event[\s\S]+FROM\s+public\.events[\s\S]+WHERE\s+id\s*=\s*p_event_id[\s\S]+FOR\s+UPDATE/i,
  );
  assert.match(
    migration,
    /IF\s+v_existing_event\.start_at\s*<=\s*now\(\)\s+THEN[\s\S]+RAISE\s+EXCEPTION\s+'Evento nao pode ser alterado/i,
  );

  const lockIndex = migration.indexOf("FOR UPDATE");
  const eventUpdateIndex = migration.indexOf("UPDATE public.events");
  const audienceDeleteIndex = migration.indexOf("DELETE FROM public.event_audiences");

  assert.ok(lockIndex > -1);
  assert.ok(eventUpdateIndex > -1);
  assert.ok(audienceDeleteIndex > -1);
  assert.ok(lockIndex < eventUpdateIndex);
  assert.ok(lockIndex < audienceDeleteIndex);

  assert.match(
    migration,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.create_events_with_audiences\s*\(\s*p_events\s+JSONB\s*\)/i,
  );
  assert.match(migration, /INSERT\s+INTO\s+public\.events/i);
  assert.match(migration, /INSERT\s+INTO\s+public\.event_audiences/i);
  assert.match(
    migration,
    /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.create_events_with_audiences\s*\(\s*JSONB\s*\)\s+TO\s+authenticated/i,
  );
});

test("member and profile hardening migration preserves assignment history and limits profile reads", () => {
  assert.equal(existsSync(hardenMemberProfileMigrationPath), true);

  const migration = readFileSync(hardenMemberProfileMigrationPath, "utf8");

  assert.match(
    migration,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.remove_ministry_member_preserving_history\s*\(\s*p_member_id\s+UUID\s*\)/i,
  );
  assert.match(
    migration,
    /IF\s+NOT\s+\(\s*public\.is_admin\(\)\s+OR\s+public\.is_ministry_leader\s*\(\s*v_member\.ministry_id\s*\)\s*\)\s+THEN/i,
  );
  assert.match(
    migration,
    /DELETE\s+FROM\s+public\.schedule_assignments[\s\S]+JOIN\s+public\.events\s+e[\s\S]+e\.start_at\s*>\s*now\(\)/i,
  );
  assert.match(
    migration,
    /DELETE\s+FROM\s+public\.ministry_members[\s\S]+WHERE\s+id\s*=\s*p_member_id/i,
  );

  assert.match(
    migration,
    /DROP\s+POLICY\s+IF\s+EXISTS\s+"Users can view all profiles"\s+ON\s+public\.profiles/i,
  );
  assert.match(
    migration,
    /CREATE\s+POLICY\s+"Users can view own profile and admins can view all profiles"[\s\S]+ON\s+public\.profiles[\s\S]+FOR\s+SELECT[\s\S]+id\s*=\s*auth\.uid\(\)[\s\S]+public\.is_admin\(\)/i,
  );
  assert.doesNotMatch(
    migration,
    /ON\s+public\.profiles\s+FOR\s+SELECT\s+USING\s*\(\s*true\s*\)/i,
  );

  assert.match(
    migration,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.search_visible_profiles\s*\([\s\S]+RETURNS\s+TABLE\s*\(\s*id\s+UUID,\s*full_name\s+TEXT,\s*avatar_url\s+TEXT,\s*role\s+TEXT\s*\)/i,
  );
  assert.match(
    migration,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.get_visible_profiles_by_ids\s*\(\s*p_user_ids\s+UUID\[\]\s*\)[\s\S]+RETURNS\s+TABLE\s*\(\s*id\s+UUID,\s*full_name\s+TEXT,\s*avatar_url\s+TEXT,\s*role\s+TEXT\s*\)/i,
  );
  assert.match(
    migration,
    /CREATE\s+OR\s+REPLACE\s+FUNCTION\s+public\.list_profiles_for_event_permissions\s*\([\s\S]+RETURNS\s+TABLE\s*\([\s\S]+email\s+TEXT[\s\S]+can_manage_events\s+BOOLEAN/i,
  );
  assert.match(
    migration,
    /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.search_visible_profiles\s*\(\s*TEXT,\s*INTEGER,\s*INTEGER,\s*TEXT\[\]\s*\)\s+TO\s+authenticated/i,
  );
  assert.match(
    migration,
    /GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.remove_ministry_member_preserving_history\s*\(\s*UUID\s*\)\s+TO\s+authenticated/i,
  );
});
