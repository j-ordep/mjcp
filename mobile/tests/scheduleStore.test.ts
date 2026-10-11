import test from "node:test";
import assert from "node:assert/strict";

type ScheduleStoreModule = typeof import("../src/stores/useScheduleStore");

test("personal mode includes a leader's own assignments and does not call management", async () => {
  let personal = 0, managed = 0;
  const { useScheduleStore } = loadScheduleStoreWithMocks({
    getUserScheduleCards: async () => { personal++; return { data: [{ id: "serving-another-ministry" }], error: null }; },
    getManageableScheduleCards: async () => { managed++; return { data: [], error: null }; },
  });
  await useScheduleStore.getState().fetchScheduleCards({ userId: "leader-example", viewMode: "personal", leaderMinistryIds: ["leading-example"] });
  assert.equal(personal, 1);
  assert.equal(managed, 0);
  assert.equal(useScheduleStore.getState().viewMode, "personal");
  assert.equal(useScheduleStore.getState().scheduleCards[0].id, "serving-another-ministry");
});

test("management rejects empty scope and invalidates a preceding late read", async () => {
  let managed = 0;
  let resolve!: (value: { data: unknown[]; error: null }) => void;
  const { useScheduleStore } = loadScheduleStoreWithMocks({
    getUserScheduleCards: () => new Promise((r) => { resolve = r; }),
    getManageableScheduleCards: async () => { managed++; return { data: [], error: null }; },
  });
  const pending = useScheduleStore.getState().fetchScheduleCards({ userId: "example", viewMode: "personal" });
  await useScheduleStore.getState().fetchScheduleCards({ userId: "example", viewMode: "manageable", leaderMinistryIds: [""] });
  resolve({ data: [{ id: "late" }], error: null });
  await pending;
  assert.equal(managed, 0);
  assert.deepEqual(useScheduleStore.getState().scheduleCards, []);
  assert.match(useScheduleStore.getState().error!, /autorizado/);
  assert.equal(useScheduleStore.getState().isLoadingSchedules, false);
});

test("cache separates modes, users and ministry scopes and normalizes ordering", async () => {
  const calls: string[] = [];
  const { useScheduleStore } = loadScheduleStoreWithMocks({
    getUserScheduleCards: async (user) => { calls.push(`personal:${user}`); return { data: [], error: null }; },
    getManageableScheduleCards: async (user, ids) => { calls.push(`manageable:${user}:${ids?.join(",") ?? "admin"}`); return { data: [], error: null }; },
  });
  const fetch = useScheduleStore.getState().fetchScheduleCards;
  await fetch({ userId: "example", viewMode: "personal", leaderMinistryIds: ["a"] });
  await fetch({ userId: "example", viewMode: "personal", isAdmin: true });
  await fetch({ userId: "example", viewMode: "manageable", leaderMinistryIds: ["a", "b"] });
  await fetch({ userId: "example", viewMode: "manageable", leaderMinistryIds: ["b", "a"] });
  await fetch({ userId: "example", viewMode: "manageable", leaderMinistryIds: ["b"] });
  await fetch({ userId: "another", viewMode: "manageable", isAdmin: true });
  assert.deepEqual(calls, ["personal:example", "manageable:example:a,b", "manageable:example:b", "manageable:another:admin"]);
});

test("a later mode request discards the prior mode result", async () => {
  let resolve!: (value: { data: unknown[]; error: null }) => void;
  const { useScheduleStore } = loadScheduleStoreWithMocks({
    getUserScheduleCards: () => new Promise((r) => { resolve = r; }),
    getManageableScheduleCards: async () => ({ data: [{ id: "managed" }], error: null }),
  });
  const first = useScheduleStore.getState().fetchScheduleCards({ userId: "example", viewMode: "personal" });
  await useScheduleStore.getState().fetchScheduleCards({ userId: "example", viewMode: "manageable", leaderMinistryIds: ["example-ministry"] });
  resolve({ data: [{ id: "personal-late" }], error: null });
  await first;
  assert.equal(useScheduleStore.getState().scheduleCards[0].id, "managed");
  assert.equal(useScheduleStore.getState().viewMode, "manageable");
});

test("schedule reset invalidates a pending read and clears loading", async () => {
  let resolve!: (value: { data: unknown[]; error: null }) => void;
  const { useScheduleStore } = loadScheduleStoreWithMocks({ getUserScheduleCards: () => new Promise(r => { resolve = r; }) });
  const pending = useScheduleStore.getState().fetchScheduleCards({ userId: "user-1", viewMode: "personal" });
  useScheduleStore.getState().clearScheduleCards();
  resolve({ data: [{ id: "old" }], error: null });
  await pending;
  assert.deepEqual(useScheduleStore.getState().scheduleCards, []);
  assert.equal(useScheduleStore.getState().isLoadingSchedules, false);
});

test("schedule reads accept only the newest response", async () => {
  const resolvers: ((value: { data: unknown[]; error: null }) => void)[] = [];
  const { useScheduleStore } = loadScheduleStoreWithMocks({ getUserScheduleCards: () => new Promise(r => resolvers.push(r)) });
  const first = useScheduleStore.getState().fetchScheduleCards({ userId: "user-1", viewMode: "personal" });
  const second = useScheduleStore.getState().fetchScheduleCards({ userId: "user-2", viewMode: "personal" });
  resolvers[1]({ data: [{ id: "new" }], error: null });
  await second;
  resolvers[0]({ data: [{ id: "old" }], error: null });
  await first;
  assert.equal(useScheduleStore.getState().scheduleCards[0].id, "new");
});

test("same-user new login discards the previous login response", async () => {
  const resolvers: ((value: { data: unknown[]; error: string | null }) => void)[] = [];
  const { useScheduleStore } = loadScheduleStoreWithMocks({ getUserScheduleCards: () => new Promise(r => resolvers.push(r)) });
  const first = useScheduleStore.getState().fetchScheduleCards({ userId: "user-1", viewMode: "personal" });
  useScheduleStore.getState().clearScheduleCards();
  const second = useScheduleStore.getState().fetchScheduleCards({ userId: "user-1", viewMode: "personal" });
  resolvers[1]({ data: [{ id: "new-login" }], error: null });
  await second;
  resolvers[0]({ data: [], error: "old failure" });
  await first;
  assert.equal(useScheduleStore.getState().scheduleCards[0].id, "new-login");
  assert.equal(useScheduleStore.getState().error, null);
});

function createModuleCacheEntry(exports: Record<string, unknown>, filename: string) {
  return {
    id: filename,
    filename,
    loaded: true,
    exports,
    children: [],
    paths: [],
  } as unknown as NodeJS.Module;
}

function loadScheduleStoreWithMocks(options: {
  getUserScheduleCards: (userId: string) => Promise<{
    data: unknown[];
    error: string | null;
  }>;
  getManageableScheduleCards?: (
    userId: string,
    leaderMinistryIds?: string[],
  ) => Promise<{
    data: unknown[];
    error: string | null;
  }>;
}) {
  const scheduleServiceModulePath = require.resolve("../src/services/scheduleService");
  const scheduleStoreModulePath = require.resolve("../src/stores/useScheduleStore");

  delete require.cache[scheduleStoreModulePath];
  delete require.cache[scheduleServiceModulePath];

  require.cache[scheduleServiceModulePath] = createModuleCacheEntry(
    {
      getUserScheduleCards: options.getUserScheduleCards,
      getManageableScheduleCards:
        options.getManageableScheduleCards ??
        (async () => ({ data: [], error: null })),
    },
    scheduleServiceModulePath,
  );

  return require("../src/stores/useScheduleStore") as ScheduleStoreModule;
}

test("fetchScheduleCards reloads when the requested user changes", async () => {
  const loadedUserIds: string[] = [];
  const scheduleStore = loadScheduleStoreWithMocks({
    getUserScheduleCards: async (userId) => {
      loadedUserIds.push(userId);

      return {
        data: [
          {
            id: `schedule-${userId}`,
          },
        ],
        error: null,
      };
    },
  });

  await scheduleStore.useScheduleStore.getState().fetchScheduleCards({
    userId: "user-1",
    viewMode: "personal",
  });
  await scheduleStore.useScheduleStore.getState().fetchScheduleCards({
    userId: "user-2",
    viewMode: "personal",
  });

  assert.deepEqual(loadedUserIds, ["user-1", "user-2"]);
  assert.equal(
    scheduleStore.useScheduleStore.getState().scheduleCards[0]?.id,
    "schedule-user-2",
  );
});
