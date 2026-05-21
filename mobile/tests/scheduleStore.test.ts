import test from "node:test";
import assert from "node:assert/strict";

type ScheduleStoreModule = typeof import("../src/stores/useScheduleStore");

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
  });
  await scheduleStore.useScheduleStore.getState().fetchScheduleCards({
    userId: "user-2",
  });

  assert.deepEqual(loadedUserIds, ["user-1", "user-2"]);
  assert.equal(
    scheduleStore.useScheduleStore.getState().scheduleCards[0]?.id,
    "schedule-user-2",
  );
});
