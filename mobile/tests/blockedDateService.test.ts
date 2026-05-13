import test from "node:test";
import assert from "node:assert/strict";
import { loadServiceModule } from "./serviceTestHelpers";

type BlockedDateService = typeof import("../src/services/blockedDateService");

function createBlockedDatesMock(config: {
  selectData?: unknown[];
  selectError?: { message: string } | null;
  insertError?: { message: string } | null;
  deleteError?: { message: string } | null;
}) {
  const calls = {
    from: [] as string[],
    select: [] as unknown[][],
    eq: [] as unknown[][],
    order: [] as unknown[][],
    insert: [] as unknown[][],
    delete: [] as unknown[][],
    in: [] as unknown[][],
  };

  const builder: any = {
    select: (...args: unknown[]) => {
      calls.select.push(args);
      return builder;
    },
    eq: (...args: unknown[]) => {
      calls.eq.push(args);
      return builder;
    },
    order: (...args: unknown[]) => {
      calls.order.push(args);
      return builder;
    },
    insert: (...args: unknown[]) => {
      calls.insert.push(args);
      return builder;
    },
    delete: (...args: unknown[]) => {
      calls.delete.push(args);
      return builder;
    },
    in: (...args: unknown[]) => {
      calls.in.push(args);
      return builder;
    },
    then: (
      onfulfilled: (value: { data: unknown; error: { message: string } | null }) => unknown,
      onrejected?: (reason: unknown) => unknown,
    ) => {
      const response =
        calls.insert.length > 0
          ? { data: null, error: config.insertError ?? null }
          : calls.delete.length > 0
            ? { data: null, error: config.deleteError ?? null }
            : {
                data: config.selectData ?? [],
                error: config.selectError ?? null,
              };

      return Promise.resolve(response).then(onfulfilled, onrejected);
    },
  };

  return {
    calls,
    supabaseMock: {
      from: (table: string) => {
        calls.from.push(table);
        return builder;
      },
    },
  };
}

test("listBlockedDatesForUser loads user dates ordered by date", async () => {
  const { calls, supabaseMock } = createBlockedDatesMock({
    selectData: [
      { id: "blocked-1", user_id: "user-1", date: "2026-05-20", reason: null, created_at: "2026-05-01T00:00:00.000Z" },
      { id: "blocked-2", user_id: "user-1", date: "2026-05-25", reason: null, created_at: "2026-05-02T00:00:00.000Z" },
    ],
  });

  const { listBlockedDatesForUser } = loadServiceModule<BlockedDateService>(
    "../src/services/blockedDateService",
    supabaseMock,
  );

  const result = await listBlockedDatesForUser("user-1");

  assert.equal(result.error, null);
  assert.deepEqual(result.data, [
    { id: "blocked-1", user_id: "user-1", date: "2026-05-20", reason: null, created_at: "2026-05-01T00:00:00.000Z" },
    { id: "blocked-2", user_id: "user-1", date: "2026-05-25", reason: null, created_at: "2026-05-02T00:00:00.000Z" },
  ]);
  assert.equal(calls.from[0], "blocked_dates");
  assert.deepEqual(calls.eq[0], ["user_id", "user-1"]);
  assert.deepEqual(calls.order[0], ["date", { ascending: true }]);
});

test("syncBlockedDatesForUser inserts new dates and removes unchecked dates", async () => {
  const { calls, supabaseMock } = createBlockedDatesMock({
    selectData: [
      { id: "blocked-1", user_id: "user-1", date: "2026-05-20", reason: null, created_at: "2026-05-01T00:00:00.000Z" },
      { id: "blocked-2", user_id: "user-1", date: "2026-05-25", reason: null, created_at: "2026-05-02T00:00:00.000Z" },
    ],
  });

  const { syncBlockedDatesForUser } = loadServiceModule<BlockedDateService>(
    "../src/services/blockedDateService",
    supabaseMock,
  );

  const result = await syncBlockedDatesForUser("user-1", [
    "2026-05-25",
    "2026-05-28",
    "2026-05-28",
  ]);

  assert.equal(result.error, null);
  assert.deepEqual(result.data, {
    addedDates: ["2026-05-28"],
    removedDates: ["2026-05-20"],
  });
  assert.deepEqual(calls.insert[0], [[{ user_id: "user-1", date: "2026-05-28" }]]);
  assert.deepEqual(calls.delete[0], []);
  assert.deepEqual(calls.eq.at(-1), ["user_id", "user-1"]);
  assert.deepEqual(calls.in[0], ["date", ["2026-05-20"]]);
});
