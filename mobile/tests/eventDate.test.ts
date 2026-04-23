import test from "node:test";
import assert from "node:assert/strict";
import {
  createLocalDateTime,
  formatLocalDateKey,
  formatTimeFromDate,
  getDefaultEndAt,
  normalizeEventRange,
} from "../src/utils/eventDate";

function withFixedDate<T>(dateIso: string, fn: () => T) {
  const RealDate = Date;
  const fixedMillis = new RealDate(dateIso).getTime();

  class FixedDate extends RealDate {
    constructor(...args: [] | [string | number | Date]) {
      if (args.length === 0) {
        super(fixedMillis);
        return;
      }

      super(args[0]);
    }

    static now() {
      return fixedMillis;
    }
  }

  globalThis.Date = FixedDate as typeof Date;

  try {
    return fn();
  } finally {
    globalThis.Date = RealDate;
  }
}

test("formatTimeFromDate returns a zero-padded HH:mm time", () => {
  const result = formatTimeFromDate(new Date(2026, 3, 9, 7, 5));

  assert.equal(result, "07:05");
});

test("formatLocalDateKey returns a zero-padded yyyy-mm-dd key", () => {
  const result = formatLocalDateKey(new Date(2026, 0, 3, 12, 0));

  assert.equal(result, "2026-01-03");
});

test("createLocalDateTime builds a local Date from separate date and time values", () => {
  const result = createLocalDateTime("2026-04-09", "18:45");

  assert.equal(result.getFullYear(), 2026);
  assert.equal(result.getMonth(), 3);
  assert.equal(result.getDate(), 9);
  assert.equal(result.getHours(), 18);
  assert.equal(result.getMinutes(), 45);
});

test("getDefaultEndAt adds three hours to the start time", () => {
  const result = getDefaultEndAt(new Date("2026-04-09T10:00:00.000Z"));

  assert.equal(result.toISOString(), "2026-04-09T13:00:00.000Z");
});

test("normalizeEventRange returns normalized data when start and end are valid", () => {
  const result = normalizeEventRange({
    startAt: "2026-04-09T10:00:00.000Z",
    endAt: "2026-04-09T12:30:00.000Z",
  });

  assert.deepEqual(result, {
    data: {
      startAt: "2026-04-09T10:00:00.000Z",
      endAt: "2026-04-09T12:30:00.000Z",
    },
    error: null,
  });
});

test("normalizeEventRange uses the default duration when endAt is omitted", () => {
  const result = normalizeEventRange({
    startAt: "2026-04-09T10:00:00.000Z",
  });

  assert.deepEqual(result, {
    data: {
      startAt: "2026-04-09T10:00:00.000Z",
      endAt: "2026-04-09T13:00:00.000Z",
    },
    error: null,
  });
});

test("normalizeEventRange rejects invalid start and end dates", () => {
  const invalidStart = normalizeEventRange({
    startAt: "invalid",
    endAt: "2026-04-09T12:30:00.000Z",
  });
  const invalidEnd = normalizeEventRange({
    startAt: "2026-04-09T10:00:00.000Z",
    endAt: "invalid",
  });

  assert.deepEqual(invalidStart, {
    data: null,
    error: "Data inicial invalida.",
  });
  assert.deepEqual(invalidEnd, {
    data: null,
    error: "Data final invalida.",
  });
});

test("normalizeEventRange rejects ranges where the end is not after the start", () => {
  const result = normalizeEventRange({
    startAt: "2026-04-09T10:00:00.000Z",
    endAt: "2026-04-09T10:00:00.000Z",
  });

  assert.deepEqual(result, {
    data: null,
    error: "A data final deve ser maior que a data inicial.",
  });
});

test("normalizeEventRange rejects past starts when requireFutureStart is enabled", () => {
  const result = withFixedDate("2026-04-10T10:00:00.000Z", () =>
    normalizeEventRange({
      startAt: "2026-04-09T10:00:00.000Z",
      endAt: "2026-04-09T12:00:00.000Z",
      requireFutureStart: true,
    }),
  );

  assert.deepEqual(result, {
    data: null,
    error: "Nao e permitido criar evento com data/hora no passado.",
  });
});

test("normalizeEventRange uses now when startAt is omitted", () => {
  const result = withFixedDate("2026-04-09T10:00:00.000Z", () =>
    normalizeEventRange({
      endAt: "2026-04-09T14:00:00.000Z",
    }),
  );

  assert.deepEqual(result, {
    data: {
      startAt: "2026-04-09T10:00:00.000Z",
      endAt: "2026-04-09T14:00:00.000Z",
    },
    error: null,
  });
});
