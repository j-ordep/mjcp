import test from "node:test";
import assert from "node:assert/strict";
import {
  compareEventDatesByFilter,
  matchesEventTimeFilter,
} from "../src/utils/eventFilters";

type EventLike = {
  start_at: string;
  end_at?: string | null;
};

test("matchesEventTimeFilter keeps an ongoing event in current until end_at", () => {
  const event: EventLike = {
    start_at: "2026-04-29T19:00:00.000Z",
    end_at: "2026-04-29T21:00:00.000Z",
  };

  const isCurrent = matchesEventTimeFilter(
    event,
    "current",
    new Date("2026-04-29T20:00:00.000Z").getTime(),
  );

  const isPast = matchesEventTimeFilter(
    event,
    "past",
    new Date("2026-04-29T20:00:00.000Z").getTime(),
  );

  assert.equal(isCurrent, true);
  assert.equal(isPast, false);
});

test("matchesEventTimeFilter moves an event to past at end_at", () => {
  const event: EventLike = {
    start_at: "2026-04-29T19:00:00.000Z",
    end_at: "2026-04-29T21:00:00.000Z",
  };

  const isCurrent = matchesEventTimeFilter(
    event,
    "current",
    new Date("2026-04-29T21:00:00.000Z").getTime(),
  );

  const isPast = matchesEventTimeFilter(
    event,
    "past",
    new Date("2026-04-29T21:00:00.000Z").getTime(),
  );

  assert.equal(isCurrent, false);
  assert.equal(isPast, true);
});

test("matchesEventTimeFilter falls back to start_at when end_at is missing", () => {
  const event: EventLike = {
    start_at: "2026-04-29T19:00:00.000Z",
    end_at: null,
  };

  assert.equal(
    matchesEventTimeFilter(
      event,
      "current",
      new Date("2026-04-29T18:59:00.000Z").getTime(),
    ),
    true,
  );
  assert.equal(
    matchesEventTimeFilter(
      event,
      "past",
      new Date("2026-04-29T19:00:00.000Z").getTime(),
    ),
    true,
  );
});

test("compareEventDatesByFilter sorts current by nearest start and past by most recent start", () => {
  const currentA: EventLike = { start_at: "2026-05-02T19:00:00.000Z" };
  const currentB: EventLike = { start_at: "2026-05-01T19:00:00.000Z" };

  const pastA: EventLike = { start_at: "2026-04-29T19:00:00.000Z" };
  const pastB: EventLike = { start_at: "2026-04-28T19:00:00.000Z" };

  assert.equal(compareEventDatesByFilter(currentA, currentB, "current") > 0, true);
  assert.equal(compareEventDatesByFilter(pastA, pastB, "past") < 0, true);
});
