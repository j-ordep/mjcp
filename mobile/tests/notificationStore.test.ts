import test from "node:test";
import assert from "node:assert/strict";

type NotificationStoreModule = typeof import("../src/stores/useNotificationStore");

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

function loadNotificationStoreWithMocks(options: {
  getNotifications?: (userId: string) => Promise<{ data: unknown[]; error: string | null }>;
  getUnreadNotificationsCount?: (userId: string) => Promise<{ data: number | null; error: string | null }>;
  markNotificationAsRead?: (notificationId: string, userId: string) => Promise<{ error: string | null }>;
  markAllNotificationsAsRead?: (userId: string) => Promise<{ error: string | null }>;
  subscribeToNotifications?: (input: {
    userId: string;
    onInsert?: (notification: any) => void;
    onUpdate?: (notification: any) => void;
  }) => { unsubscribe: () => void | Promise<void> };
}) {
  const notificationServiceModulePath = require.resolve("../src/services/notificationService");
  const notificationStoreModulePath = require.resolve("../src/stores/useNotificationStore");

  delete require.cache[notificationStoreModulePath];
  delete require.cache[notificationServiceModulePath];

  require.cache[notificationServiceModulePath] = createModuleCacheEntry(
    {
      getNotifications:
        options.getNotifications ??
        (async () => ({
          data: [],
          error: null,
        })),
      getUnreadNotificationsCount:
        options.getUnreadNotificationsCount ??
        (async () => ({
          data: 0,
          error: null,
        })),
      markNotificationAsRead:
        options.markNotificationAsRead ??
        (async () => ({
          error: null,
        })),
      markAllNotificationsAsRead:
        options.markAllNotificationsAsRead ??
        (async () => ({
          error: null,
        })),
      subscribeToNotifications:
        options.subscribeToNotifications ??
        (() => ({
          unsubscribe: () => undefined,
        })),
    },
    notificationServiceModulePath,
  );

  return require("../src/stores/useNotificationStore") as NotificationStoreModule;
}

test("bootstrap loads notifications and unread count for the requested user", async () => {
  const notificationStore = loadNotificationStoreWithMocks({
    getNotifications: async () => ({
      data: [
        {
          id: "notification-1",
          user_id: "user-1",
          title: "Nova escala",
          body: "Voce foi escalado.",
          type: "schedule",
          data: {
            action: "assigned",
            schedule_id: "schedule-1",
            event_id: "event-1",
            ministry_id: "ministry-1",
            assignment_id: "assignment-1",
            role_id: "role-1",
          },
          payload: {
            action: "assigned",
            schedule_id: "schedule-1",
            event_id: "event-1",
            ministry_id: "ministry-1",
            assignment_id: "assignment-1",
            role_id: "role-1",
          },
          read: false,
          created_at: "2026-05-22T00:00:00.000Z",
        },
      ],
      error: null,
    }),
    getUnreadNotificationsCount: async () => ({
      data: 1,
      error: null,
    }),
  });

  await notificationStore.useNotificationStore.getState().bootstrap("user-1");

  const state = notificationStore.useNotificationStore.getState();
  assert.equal(state.subscribedUserId, "user-1");
  assert.equal(state.notifications[0]?.id, "notification-1");
  assert.equal(state.unreadCount, 1);
});

test("notification store forwards the current user to every request", async () => {
  const users: string[] = [];
  const module = loadNotificationStoreWithMocks({
    getNotifications: async userId => { users.push(userId); return { data: [], error: null }; },
    getUnreadNotificationsCount: async userId => { users.push(userId); return { data: 1, error: null }; },
    markNotificationAsRead: async (_id, userId) => { users.push(userId); return { error: null }; },
    markAllNotificationsAsRead: async userId => { users.push(userId); return { error: null }; },
  });
  const store = module.useNotificationStore;
  await store.getState().bootstrap("user-1");
  await store.getState().refreshNotifications();
  await store.getState().refreshUnreadCount();
  store.setState({ notifications: [{ id: "notification-1", user_id: "user-1", read: false } as any] });
  await store.getState().markAsRead("notification-1");
  store.setState({ unreadCount: 1 });
  await store.getState().markAllAsRead();
  assert.deepEqual(users, Array(6).fill("user-1"));
});

test("a pending inbox response cannot restore notifications after logout", async () => {
  let resolveNotifications!: (result: { data: unknown[]; error: null }) => void;
  const module = loadNotificationStoreWithMocks({
    getNotifications: () => new Promise(resolve => { resolveNotifications = resolve; }),
    getUnreadNotificationsCount: async () => ({ data: 7, error: null }),
  });
  const store = module.useNotificationStore;
  const pending = store.getState().bootstrap("user-1");
  store.getState().clear();
  resolveNotifications({ data: [], error: null });
  await pending;
  assert.equal(store.getState().subscribedUserId, null);
  assert.equal(store.getState().unreadCount, 0);
});

test("an old realtime channel cannot add notifications after the user changes", async () => {
  const handlers = new Map<string, (notification: any) => void>();
  const module = loadNotificationStoreWithMocks({
    subscribeToNotifications: ({ userId, onInsert }) => {
      handlers.set(userId, onInsert!);
      return { unsubscribe: () => undefined };
    },
  });
  const store = module.useNotificationStore;
  await store.getState().connectRealtime("user-1");
  await store.getState().bootstrap("user-2");
  await store.getState().connectRealtime("user-2");
  handlers.get("user-1")!({ id: "old-notification", user_id: "user-1", read: false });
  assert.equal(store.getState().notifications.length, 0);
  assert.equal(store.getState().unreadCount, 0);
  assert.ok(handlers.has("user-2"));
});

test("clearing the session cancels an in-progress realtime connection", async () => {
  let subscriptions = 0;
  const module = loadNotificationStoreWithMocks({
    subscribeToNotifications: () => { subscriptions++; return { unsubscribe: () => undefined }; },
  });
  const store = module.useNotificationStore;
  const pending = store.getState().connectRealtime("user-1");
  store.getState().clear();
  await pending;
  assert.equal(subscriptions, 0);
  assert.equal(store.getState().subscribedUserId, null);
});

test("waiting for an old channel to close does not discard the new inbox", async () => {
  let finishUnsubscribe!: () => void;
  const module = loadNotificationStoreWithMocks({
    getUnreadNotificationsCount: async () => ({ data: 7, error: null }),
    subscribeToNotifications: () => ({
      unsubscribe: () => new Promise<void>(resolve => { finishUnsubscribe = resolve; }),
    }),
  });
  const store = module.useNotificationStore;
  await store.getState().connectRealtime("user-1");
  const bootstrap = store.getState().bootstrap("user-2");
  const connection = store.getState().connectRealtime("user-2");
  await bootstrap;
  const snapshot = store.getState();
  finishUnsubscribe();
  await connection;
  assert.equal(snapshot.subscribedUserId, "user-2");
  assert.equal(snapshot.unreadCount, 7);
  assert.equal(snapshot.isLoading, false);
});

test("a previous login response cannot overwrite a new login by the same user", async () => {
  let resolveOld!: (result: { data: unknown[]; error: null }) => void;
  let requests = 0;
  let counts = 0;
  const module = loadNotificationStoreWithMocks({
    getNotifications: () => ++requests === 1 ? new Promise(resolve => { resolveOld = resolve; }) :
      Promise.resolve({ data: [], error: null }),
    getUnreadNotificationsCount: async () => ({ data: ++counts === 1 ? 7 : 0, error: null }),
  });
  const store = module.useNotificationStore;
  const old = store.getState().bootstrap("user-1");
  store.getState().clear();
  await store.getState().bootstrap("user-1");
  resolveOld({ data: [], error: null });
  await old;
  assert.equal(store.getState().unreadCount, 0);
});

test("a previous channel is ignored after reconnecting the same user", async () => {
  const inserts: Array<(notification: any) => void> = [];
  const module = loadNotificationStoreWithMocks({
    subscribeToNotifications: ({ onInsert }) => {
      inserts.push(onInsert!);
      return { unsubscribe: () => undefined };
    },
  });
  const store = module.useNotificationStore;
  await store.getState().connectRealtime("user-1");
  store.getState().clear();
  await store.getState().connectRealtime("user-1");
  inserts[0]({ id: "old", user_id: "user-1", read: false });
  assert.equal(store.getState().notifications.length, 0);
  assert.equal(store.getState().unreadCount, 0);
});

test("reconnecting waits until the SDK has removed the previous channel", async () => {
  let finishUnsubscribe!: () => void;
  let subscriptions = 0;
  const module = loadNotificationStoreWithMocks({
    subscribeToNotifications: () => {
      subscriptions++;
      return { unsubscribe: () => new Promise<void>(resolve => { finishUnsubscribe = resolve; }) };
    },
  });
  const store = module.useNotificationStore;
  await store.getState().connectRealtime("user-1");
  store.getState().clear();
  const reconnect = store.getState().connectRealtime("user-1");
  await Promise.resolve();
  const subscriptionsBeforeClosing = subscriptions;
  finishUnsubscribe();
  await reconnect;
  assert.equal(subscriptionsBeforeClosing, 1);
  assert.equal(subscriptions, 2);
});

test("connectRealtime syncs insert and update events and replaces the previous subscription", async () => {
  const handlersByUser = new Map<
    string,
    {
      onInsert?: (notification: any) => void;
      onUpdate?: (notification: any) => void;
    }
  >();
  const unsubscribedUsers: string[] = [];

  const notificationStore = loadNotificationStoreWithMocks({
    subscribeToNotifications: ({ userId, onInsert, onUpdate }) => {
      handlersByUser.set(userId, { onInsert, onUpdate });

      return {
        unsubscribe: () => {
          unsubscribedUsers.push(userId);
        },
      };
    },
  });

  await notificationStore.useNotificationStore.getState().connectRealtime("user-1");
  await notificationStore.useNotificationStore.getState().connectRealtime("user-2");

  assert.deepEqual(unsubscribedUsers, ["user-1"]);
  assert.equal(notificationStore.useNotificationStore.getState().subscribedUserId, "user-2");

  handlersByUser.get("user-2")?.onInsert?.({
    id: "notification-2",
    user_id: "user-2",
    title: "Nova escala",
    body: "Voce foi escalado.",
    type: "schedule",
    data: {
      action: "assigned",
      schedule_id: "schedule-2",
      event_id: "event-2",
      ministry_id: "ministry-2",
      assignment_id: "assignment-2",
      role_id: "role-2",
    },
    payload: {
      action: "assigned",
      schedule_id: "schedule-2",
      event_id: "event-2",
      ministry_id: "ministry-2",
      assignment_id: "assignment-2",
      role_id: "role-2",
    },
    read: false,
    created_at: "2026-05-22T00:00:00.000Z",
  });

  let state = notificationStore.useNotificationStore.getState();
  assert.equal(state.notifications[0]?.id, "notification-2");
  assert.equal(state.unreadCount, 1);

  handlersByUser.get("user-2")?.onUpdate?.({
    ...state.notifications[0],
    read: true,
  });

  state = notificationStore.useNotificationStore.getState();
  assert.equal(state.notifications[0]?.read, true);
  assert.equal(state.unreadCount, 0);
});

test("markAsRead, markAllAsRead, disconnectRealtime and clear reconcile local state", async () => {
  let singleMarkCalls = 0;
  let allMarkCalls = 0;
  let unsubscribeCalls = 0;

  const notificationStore = loadNotificationStoreWithMocks({
    getNotifications: async () => ({
      data: [
        {
          id: "notification-1",
          user_id: "user-1",
          title: "Nova escala",
          body: "Voce foi escalado.",
          type: "schedule",
          data: {
            action: "assigned",
            schedule_id: "schedule-1",
            event_id: "event-1",
            ministry_id: "ministry-1",
            assignment_id: "assignment-1",
            role_id: "role-1",
          },
          payload: {
            action: "assigned",
            schedule_id: "schedule-1",
            event_id: "event-1",
            ministry_id: "ministry-1",
            assignment_id: "assignment-1",
            role_id: "role-1",
          },
          read: false,
          created_at: "2026-05-22T00:00:00.000Z",
        },
      ],
      error: null,
    }),
    getUnreadNotificationsCount: async () => ({
      data: 1,
      error: null,
    }),
    markNotificationAsRead: async () => {
      singleMarkCalls += 1;
      return { error: null };
    },
    markAllNotificationsAsRead: async () => {
      allMarkCalls += 1;
      return { error: null };
    },
    subscribeToNotifications: () => ({
      unsubscribe: () => {
        unsubscribeCalls += 1;
      },
    }),
  });

  await notificationStore.useNotificationStore.getState().bootstrap("user-1");
  await notificationStore.useNotificationStore.getState().connectRealtime("user-1");
  await notificationStore.useNotificationStore.getState().markAsRead("notification-1");

  let state = notificationStore.useNotificationStore.getState();
  assert.equal(singleMarkCalls, 1);
  assert.equal(state.notifications[0]?.read, true);
  assert.equal(state.unreadCount, 0);

  state.notifications = state.notifications.map((notification) => ({
    ...notification,
    read: false,
  }));
  notificationStore.useNotificationStore.setState({
    notifications: state.notifications,
    unreadCount: 1,
  });

  await notificationStore.useNotificationStore.getState().markAllAsRead();

  state = notificationStore.useNotificationStore.getState();
  assert.equal(allMarkCalls, 1);
  assert.equal(state.unreadCount, 0);
  assert.equal(state.notifications.every((notification) => notification.read), true);

  await notificationStore.useNotificationStore.getState().disconnectRealtime();
  assert.equal(unsubscribeCalls, 1);

  notificationStore.useNotificationStore.getState().clear();
  state = notificationStore.useNotificationStore.getState();
  assert.equal(state.notifications.length, 0);
  assert.equal(state.unreadCount, 0);
  assert.equal(state.subscribedUserId, null);
});
