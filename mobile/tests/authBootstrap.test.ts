import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

// Exercise the navigator effects without loading React Native in Node.
// Supabase awaits auth callbacks while holding its session lock.
function mountNavigator(options: {
  session?: unknown;
  getSession?: () => Promise<unknown>;
  getProfile?: (userId: string) => Promise<unknown>;
} = {}) {
  const effects: (() => void | (() => void))[] = [];
  const state = { session: null as unknown, profile: null as unknown, isLoading: true, sessionRevision: 0 };
  const resets = { events: 0, ministries: 0, schedules: 0, notifications: 0 };
  let authCallback: (event: string, session: unknown) => unknown = () => {};
  let unsubscribed = false;
  const authStore = Object.assign(
    (selector?: (value: unknown) => unknown) => selector ? selector(authStore.getState()) : authStore.getState(),
    { getState: () => ({
      ...state,
      setSession: (session: unknown) => {
        const id = (value: unknown) => (value as { user?: { id: string } } | null)?.user?.id;
        if (id(session) !== id(state.session)) state.sessionRevision++;
        state.session = session;
      },
      setProfile: (profile: unknown) => { state.profile = profile; },
      setLoading: (loading: boolean) => { state.isLoading = loading; },
    }) },
  );
  const notificationActions = {
    bootstrap: async () => {}, connectRealtime: async () => {},
    disconnectRealtime: async () => {}, clear: () => { resets.notifications++; },
  };
  const mocks: Record<string, unknown> = {
    react: { ...require("react"), useEffect: (effect: () => void) => effects.push(effect) },
    "@react-navigation/native": { NavigationContainer: () => null },
    "@react-navigation/native-stack": { createNativeStackNavigator: () => ({}) },
    "react-native": { View: () => null, ActivityIndicator: () => null },
    // Visual provider configuration must not load native Paper in this Node harness.
    theme: { navigationTheme: {} },
    useAuthStore: { useAuthStore: authStore },
    useEventStore: { useEventStore: { getState: () => ({ clearEvents: () => resets.events++ }) } },
    useMinistryStore: { useMinistryStore: { getState: () => ({ clearMinistries: () => resets.ministries++ }) } },
    useScheduleStore: { useScheduleStore: { getState: () => ({ clearScheduleCards: () => resets.schedules++ }) } },
    useNotificationStore: { useNotificationStore: Object.assign((select: (value: unknown) => unknown) => select(notificationActions), { getState: () => notificationActions }) },
    supabase: { supabase: { auth: {
      getSession: options.getSession ?? (async () => ({ data: { session: options.session ?? null }, error: null })),
      onAuthStateChange: (callback: typeof authCallback) => {
        authCallback = callback;
        return { data: { subscription: { unsubscribe: () => { unsubscribed = true; } } } };
      },
    } } },
    profileService: { getProfile: options.getProfile ?? (async () => ({ profile: null, error: null })) },
  };
  const loaded = new Map<string, { exports: Record<string, unknown> }>();
  function loadSource(filename: string): Record<string, unknown> {
    const cached = loaded.get(filename);
    if (cached) return cached.exports;
    const module = { exports: {} as Record<string, unknown> };
    loaded.set(filename, module);
    const source = ts.transpileModule(readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
      fileName: filename,
    }).outputText;
    const customRequire = (name: string): unknown => {
      const mocked = mocks[name] ?? mocks[path.basename(name)];
      if (mocked) return mocked;
      if (name.includes("/screens/") || name.includes("/components/")) return { default: () => null };
      if (name.startsWith(".")) {
        const resolved = path.resolve(path.dirname(filename), name);
        for (const extension of [".ts", ".tsx"]) {
          if (existsSync(resolved + extension)) return loadSource(resolved + extension);
        }
      }
      return require(name);
    };
    vm.runInNewContext(source, {
      exports: module.exports, module, require: customRequire,
      setTimeout, clearTimeout, console: { log() {}, error() {} },
    }, { filename });
    return module.exports;
  }
  const navigator = loadSource(path.resolve("src/navigation/AppNavigator.tsx"));
  (navigator.default as () => unknown)();
  const cleanups = effects.map((effect) => effect());
  return {
    state,
    resets,
    emit: (event: string, session: unknown) => authCallback(event, session),
    cleanup: () => cleanups.forEach((cleanup) => cleanup?.()),
    isUnsubscribed: () => unsubscribed,
  };
}

const session = { user: { id: "user-example" } };
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 10));

test("notification subscription reconnects on same-user new login but preserves token refresh", () => {
  const calls: string[] = [];
  const actions = {
    bootstrap: async (id: string) => { calls.push(`bootstrap:${id}`); },
    connectRealtime: async (id: string) => { calls.push(`connect:${id}`); },
    disconnectRealtime: async () => { calls.push("disconnect"); },
    clear: () => { calls.push("clear"); },
  };
  let previous: unknown[] | undefined;
  let cleanup: (() => void) | undefined;
  const module = { exports: {} as { useNotificationSubscription?: (id: string, revision: number) => void } };
  const filename = path.resolve("src/hooks/useNotificationSubscription.ts");
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, require: (name: string) => name === "react" ? {
    useEffect: (effect: () => (() => void) | undefined, dependencies: unknown[]) => {
      if (!previous || dependencies.some((value, index) => value !== previous![index])) {
        cleanup?.();
        cleanup = effect();
        previous = dependencies;
      }
    },
  } : { useNotificationStore: (select: (state: typeof actions) => unknown) => select(actions) } }, { filename });
  const render = module.exports.useNotificationSubscription!;
  render("user-example", 1);
  render("user-example", 1);
  assert.deepEqual(calls, ["bootstrap:user-example", "connect:user-example"]);
  render("user-example", 3);
  assert.deepEqual(calls, ["bootstrap:user-example", "connect:user-example", "disconnect", "bootstrap:user-example", "connect:user-example"]);
  cleanup?.();
});

test("identity change clears old profile and caches synchronously without reopening loading", async () => {
  const navigator = mountNavigator({ session, getProfile: async id => ({ profile: { id }, error: null }) });
  await tick();
  const initial = { ...navigator.resets };
  navigator.emit("SIGNED_IN", { user: { id: "other-user" } });
  assert.equal(navigator.state.profile, null);
  assert.equal(navigator.state.isLoading, false);
  assert.deepEqual(navigator.resets, { events: initial.events + 1, ministries: initial.ministries + 1, schedules: initial.schedules + 1, notifications: initial.notifications + 1 });
  navigator.cleanup();
});

test("same user refresh and repeated sign in preserve caches and profile", async () => {
  const navigator = mountNavigator({ session, getProfile: async id => ({ profile: { id }, error: null }) });
  await tick();
  const initial = { ...navigator.resets };
  const profile = navigator.state.profile;
  const revision = navigator.state.sessionRevision;
  navigator.emit("TOKEN_REFRESHED", session);
  navigator.emit("SIGNED_IN", session);
  assert.deepEqual(navigator.resets, initial);
  assert.equal(navigator.state.profile, profile);
  assert.equal(navigator.state.sessionRevision, revision);
  assert.equal(navigator.state.isLoading, false);
  navigator.cleanup();
});

test("logout and same user new login each invalidate cached work", async () => {
  const navigator = mountNavigator({ session, getProfile: async id => ({ profile: { id }, error: null }) });
  await tick();
  const initial = navigator.resets.events;
  navigator.emit("SIGNED_OUT", null);
  assert.equal(navigator.resets.events, initial + 1);
  navigator.emit("SIGNED_IN", session);
  assert.equal(navigator.resets.events, initial + 2);
  navigator.cleanup();
});

test("profiles resolved in reverse order retain the new login identity", async () => {
  const resolvers: ((value: unknown) => void)[] = [];
  const navigator = mountNavigator({ getSession: () => new Promise(() => {}), getProfile: () => new Promise(r => resolvers.push(r)) });
  navigator.emit("SIGNED_IN", session);
  await tick();
  navigator.emit("SIGNED_OUT", null);
  navigator.emit("SIGNED_IN", session);
  await tick();
  resolvers[1]({ profile: { id: "user-example", name: "new login" }, error: null });
  await tick();
  resolvers[0]({ profile: { id: "user-example", name: "old login" }, error: null });
  await tick();
  assert.equal((navigator.state.profile as { name: string }).name, "new login");
  navigator.cleanup();
});

test("auth callback releases the Supabase lock before loading the profile", async () => {
  let callbackRunning = false;
  let queriedWhileLocked = false;
  const navigator = mountNavigator({
    // Keep the independent bootstrap pending so this test isolates the auth event.
    getSession: () => new Promise(() => {}),
    getProfile: async () => {
      queriedWhileLocked = callbackRunning;
      return { profile: { id: "user-example" }, error: null };
    },
  });
  try {
    callbackRunning = true;
    const result = navigator.emit("TOKEN_REFRESHED", session);
    callbackRunning = false;
    assert.equal(result, undefined, "callback must finish synchronously to release the auth lock");
    await tick();
    assert.equal(queriedWhileLocked, false);
    assert.equal(navigator.state.isLoading, false);
    assert.equal((navigator.state.profile as { id: string }).id, "user-example");
  } finally {
    navigator.cleanup();
  }
});

test("startup without a saved session opens the login flow", async () => {
  const navigator = mountNavigator();
  await tick();
  assert.equal(navigator.state.session, null);
  assert.equal(navigator.state.profile, null);
  assert.equal(navigator.state.isLoading, false);
  navigator.cleanup();
  assert.equal(navigator.isUnsubscribed(), true);
});

test("a late profile response cannot restore a profile after logout", async () => {
  let resolveProfile!: (value: unknown) => void;
  const navigator = mountNavigator({
    getSession: () => new Promise(() => {}),
    getProfile: () => new Promise((resolve) => { resolveProfile = resolve; }),
  });
  navigator.emit("SIGNED_IN", session);
  await tick();
  navigator.emit("SIGNED_OUT", null);
  await tick();
  resolveProfile({ profile: { id: "user-example" }, error: null });
  await tick();
  assert.equal(navigator.state.session, null);
  assert.equal(navigator.state.profile, null);
  assert.equal(navigator.state.isLoading, false);
  navigator.cleanup();
});

test("a late bootstrap cannot overwrite a newer auth event", async () => {
  let resolveSession!: (value: unknown) => void;
  const navigator = mountNavigator({
    getSession: () => new Promise((resolve) => { resolveSession = resolve; }),
    getProfile: async (userId) => ({ profile: { id: userId }, error: null }),
  });
  navigator.emit("SIGNED_IN", session);
  await tick();
  resolveSession({ data: { session: null }, error: null });
  await tick();
  assert.equal(navigator.state.session, session);
  assert.equal((navigator.state.profile as { id: string }).id, "user-example");
  navigator.cleanup();
});

test("startup restores the saved session and loads its profile", async () => {
  const navigator = mountNavigator({
    session,
    getProfile: async (userId) => ({ profile: { id: userId }, error: null }),
  });
  await tick();
  assert.equal(navigator.state.session, session);
  assert.equal((navigator.state.profile as { id: string }).id, "user-example");
  assert.equal(navigator.state.isLoading, false);
  navigator.cleanup();
});

test("failed session restoration finishes loading and leaves the login flow", async () => {
  const navigator = mountNavigator({ getSession: async () => { throw new Error("offline"); } });
  await tick();
  assert.equal(navigator.state.session, null);
  assert.equal(navigator.state.isLoading, false);
  navigator.cleanup();
});

test("unmounting cancels a queued profile query", async () => {
  let calls = 0;
  const navigator = mountNavigator({
    getSession: () => new Promise(() => {}),
    getProfile: async () => { calls++; return { profile: null, error: null }; },
  });
  navigator.emit("SIGNED_IN", session);
  navigator.cleanup();
  await tick();
  assert.equal(calls, 0);
  assert.equal(navigator.isUnsubscribed(), true);
});
