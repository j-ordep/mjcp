import test from "node:test";
import assert from "node:assert/strict";
import {
  buildAssignmentWarningsMessage,
  countAssignmentsByStatus,
  isEventDateEditable,
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
