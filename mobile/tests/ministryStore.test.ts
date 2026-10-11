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

test("auth revision changes on identity transitions and stays stable on refresh", () => {
  const { authStore } = loadStoresWithMinistryMock(async () => ({ data: [], error: null }));
  const store = authStore.useAuthStore;
  const revision = () => (store.getState() as { sessionRevision?: number }).sessionRevision;
  const initial = revision();
  const session = { user: { id: "user-1" } } as NonNullable<ReturnType<typeof store.getState>["session"]>;
  store.getState().setSession(session);
  assert.equal(revision(), (initial ?? 0) + 1);
  const first = revision();
  store.getState().setSession({ ...session });
  assert.equal(revision(), first);
  store.getState().setSession(null);
  store.getState().setSession(session);
  assert.equal(revision(), (first ?? 0) + 2);
  store.getState().setSession({ user: { id: "user-2" } } as typeof session);
  assert.equal(revision(), (first ?? 0) + 3);
});

test("ministry reset invalidates a pending read", async () => {
  let resolve!: (value: { data: unknown[]; error: null }) => void;
  const { authStore, ministryStore } = loadStoresWithMinistryMock(() => new Promise(r => { resolve = r; }));
  setSessionUserId(authStore, "user-1");
  const pending = ministryStore.useMinistryStore.getState().fetchUserMinistries(true);
  (ministryStore.useMinistryStore.getState() as { clearMinistries?: () => void }).clearMinistries!();
  resolve({ data: [{ id: "old" }], error: null });
  await pending;
  assert.deepEqual(ministryStore.useMinistryStore.getState().userMinistries, []);
  assert.equal(ministryStore.useMinistryStore.getState().isLoadingMinistries, false);
});

test("a late ministry response cannot replace a newer user", async () => {
  const resolvers: ((value: { data: unknown[]; error: null }) => void)[] = [];
  const { authStore, ministryStore } = loadStoresWithMinistryMock(() => new Promise(r => resolvers.push(r)));
  setSessionUserId(authStore, "user-1");
  const first = ministryStore.useMinistryStore.getState().fetchUserMinistries(true);
  setSessionUserId(authStore, "user-2");
  const second = ministryStore.useMinistryStore.getState().fetchUserMinistries(true);
  resolvers[1]({ data: [{ id: "new" }], error: null });
  await second;
  resolvers[0]({ data: [{ id: "old" }], error: null });
  await first;
  assert.equal(ministryStore.useMinistryStore.getState().userMinistries[0].id, "new");
});

test("same-user ministry refresh accepts only the newest response", async () => {
  const resolvers: ((value: { data: unknown[]; error: string | null }) => void)[] = [];
  const { authStore, ministryStore } = loadStoresWithMinistryMock(() => new Promise(r => resolvers.push(r)));
  setSessionUserId(authStore, "user-1");
  const first = ministryStore.useMinistryStore.getState().fetchUserMinistries(true);
  const second = ministryStore.useMinistryStore.getState().fetchUserMinistries(true);
  resolvers[1]({ data: [{ id: "new" }], error: null });
  await second;
  resolvers[0]({ data: [], error: "old failure" });
  await first;
  assert.equal(ministryStore.useMinistryStore.getState().userMinistries[0].id, "new");
  assert.equal(ministryStore.useMinistryStore.getState().error, null);
});

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
