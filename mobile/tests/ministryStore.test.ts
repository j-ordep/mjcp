import test from "node:test";
import assert from "node:assert/strict";

type MinistryStoreModule = typeof import("../src/stores/useMinistryStore");
type AuthStoreModule = typeof import("../src/stores/useAuthStore");

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

function loadStoresWithMinistryMock(
  getUserMinistries: (userId: string) => Promise<{
    data: unknown[];
    error: string | null;
  }>,
) {
  const supabaseModulePath = require.resolve("../src/lib/supabase");
  const ministryServiceModulePath = require.resolve("../src/services/ministryService");
  const authStoreModulePath = require.resolve("../src/stores/useAuthStore");
  const ministryStoreModulePath = require.resolve("../src/stores/useMinistryStore");

  delete require.cache[ministryStoreModulePath];
  delete require.cache[authStoreModulePath];
  delete require.cache[ministryServiceModulePath];

  require.cache[supabaseModulePath] = createModuleCacheEntry(
    {
      supabase: {
        auth: {
          signOut: async () => ({ error: null }),
        },
      },
    },
    supabaseModulePath,
  );

  require.cache[ministryServiceModulePath] = createModuleCacheEntry(
    {
      getUserMinistries,
      getAllMinistries: async () => ({ data: [], error: null }),
    },
    ministryServiceModulePath,
  );

  return {
    authStore: require("../src/stores/useAuthStore") as AuthStoreModule,
    ministryStore: require("../src/stores/useMinistryStore") as MinistryStoreModule,
  };
}

function setSessionUserId(authStore: AuthStoreModule, userId: string) {
  authStore.useAuthStore.setState({
    session: {
      user: {
        id: userId,
      },
    } as ReturnType<AuthStoreModule["useAuthStore"]["getState"]>["session"],
  });
}

test("fetchUserMinistries reloads when the authenticated user changes", async () => {
  const loadedUserIds: string[] = [];
  const { authStore, ministryStore } = loadStoresWithMinistryMock(async (userId) => {
    loadedUserIds.push(userId);

    return {
      data: [
        {
          id: `ministry-${userId}`,
          name: `Ministry ${userId}`,
          description: null,
          color: "#111827",
          created_at: "2026-05-20T00:00:00.000Z",
          is_leader: false,
          joined_at: "2026-05-20T00:00:00.000Z",
        },
      ],
      error: null,
    };
  });

  setSessionUserId(authStore, "user-1");
  await ministryStore.useMinistryStore.getState().fetchUserMinistries();

  setSessionUserId(authStore, "user-2");
  await ministryStore.useMinistryStore.getState().fetchUserMinistries();

  assert.deepEqual(loadedUserIds, ["user-1", "user-2"]);
  assert.equal(
    ministryStore.useMinistryStore.getState().userMinistries[0]?.id,
    "ministry-user-2",
  );
});
