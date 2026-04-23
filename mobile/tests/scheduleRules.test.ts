import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAssignmentWarningsMessage,
  compareScheduleDatesByFilter,
  countAssignmentsByStatus,
  isEventDateEditable,
  isEventDateReadOnly,
  matchesScheduleTimeFilter,
  rangesOverlap,
  toISODateString,
} from "../src/utils/scheduleRules";

test("countAssignmentsByStatus counts total, pending and confirmed assignments", () => {
  const result = countAssignmentsByStatus([
    { status: "pending" },
    { status: "confirmed" },
    { status: "declined" },
    { status: "confirmed" },
  ]);

  assert.deepEqual(result, {
    total: 4,
    pending: 1,
    confirmed: 2,
  });
});

test("countAssignmentsByStatus returns zeros when assignments are missing", () => {
  assert.deepEqual(countAssignmentsByStatus(null), {
    total: 0,
    pending: 0,
    confirmed: 0,
  });
  assert.deepEqual(countAssignmentsByStatus(undefined), {
    total: 0,
    pending: 0,
    confirmed: 0,
  });
});

test("isEventDateEditable allows editing on the same calendar day", () => {
  const now = new Date("2026-04-09T10:00:00.000Z");
  const result = isEventDateEditable("2026-04-09T22:00:00.000Z", now);

  assert.equal(result, true);
});

test("isEventDateEditable blocks editing after the event day has passed", () => {
  const now = new Date("2026-04-10T10:00:00.000Z");
  const result = isEventDateEditable("2026-04-09T22:00:00.000Z", now);

  assert.equal(result, false);
});

test("isEventDateReadOnly blocks actions on the event day", () => {
  const now = new Date("2026-04-10T10:00:00.000Z");
  const result = isEventDateReadOnly("2026-04-10T22:00:00.000Z", now);

  assert.equal(result, true);
});

test("isEventDateReadOnly allows actions before the event day", () => {
  const now = new Date("2026-04-10T10:00:00.000Z");
  const result = isEventDateReadOnly("2026-04-11T22:00:00.000Z", now);

  assert.equal(result, false);
});

test("matchesScheduleTimeFilter keeps future schedules in current", () => {
  const now = new Date("2026-04-10T10:00:00.000Z");

  assert.equal(
    matchesScheduleTimeFilter("2026-04-11T09:00:00.000Z", "current", now),
    true,
  );
  assert.equal(
    matchesScheduleTimeFilter("2026-04-11T09:00:00.000Z", "past", now),
    false,
  );
});

test("matchesScheduleTimeFilter treats the event day as past/read-only", () => {
  const now = new Date("2026-04-10T10:00:00.000Z");

  assert.equal(
    matchesScheduleTimeFilter("2026-04-10T22:00:00.000Z", "current", now),
    false,
  );
  assert.equal(
    matchesScheduleTimeFilter("2026-04-10T22:00:00.000Z", "past", now),
    true,
  );
});

test("compareScheduleDatesByFilter sorts current schedules by nearest upcoming date first", () => {
  const result = compareScheduleDatesByFilter(
    "2026-04-18T19:00:00.000Z",
    "2026-05-05T19:00:00.000Z",
    "current",
  );

  assert.equal(result < 0, true);
});

test("compareScheduleDatesByFilter sorts past schedules by most recent event first", () => {
  const result = compareScheduleDatesByFilter(
    "2026-04-18T19:00:00.000Z",
    "2026-04-05T19:00:00.000Z",
    "past",
  );

  assert.equal(result < 0, true);
});

test("toISODateString returns a local yyyy-mm-dd date string", () => {
  const result = toISODateString("2026-12-05T14:30:00.000Z");

  assert.equal(result, "2026-12-05");
});

test("rangesOverlap returns true for intersecting time ranges", () => {
  const result = rangesOverlap(
    new Date("2026-04-09T10:00:00.000Z"),
    new Date("2026-04-09T12:00:00.000Z"),
    new Date("2026-04-09T11:00:00.000Z"),
    new Date("2026-04-09T13:00:00.000Z"),
  );

  assert.equal(result, true);
});

test("rangesOverlap returns false for touching but non-overlapping ranges", () => {
  const result = rangesOverlap(
    new Date("2026-04-09T10:00:00.000Z"),
    new Date("2026-04-09T12:00:00.000Z"),
    new Date("2026-04-09T12:00:00.000Z"),
    new Date("2026-04-09T13:00:00.000Z"),
  );

  assert.equal(result, false);
});

test("buildAssignmentWarningsMessage formats blocked dates and the first two conflicts", () => {
  const result = buildAssignmentWarningsMessage([
    { type: "blocked_date", date: "2026-04-09" },
    {
      type: "conflict",
      event_id: "event-1",
      event_title: "Culto de Domingo",
      ministry_name: "Louvor",
      role_name: "Vocal",
      start_at: "2026-04-09T10:00:00.000Z",
      end_at: null,
    },
    {
      type: "conflict",
      event_id: "event-2",
      event_title: "Ensaio",
      ministry_name: null,
      role_name: null,
      start_at: "2026-04-09T12:00:00.000Z",
      end_at: null,
    },
    {
      type: "conflict",
      event_id: "event-3",
      event_title: "Reuniao",
      ministry_name: "Midia",
      role_name: "Camera",
      start_at: "2026-04-09T14:00:00.000Z",
      end_at: null,
    },
  ]);

  assert.equal(
    result,
    [
      "Data bloqueada pelo membro: 2026-04-09.",
      "Conflito: Culto de Domingo (Louvor) - Vocal",
      "Conflito: Ensaio",
      "Mais 1 conflito(s).",
    ].join("\n"),
  );
});

test("buildAssignmentWarningsMessage returns an empty string when there are no warnings", () => {
  const result = buildAssignmentWarningsMessage([]);

  assert.equal(result, "");
});
