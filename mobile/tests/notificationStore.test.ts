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
  getNotifications?: () => Promise<{ data: unknown[]; error: string | null }>;
  getUnreadNotificationsCount?: () => Promise<{ data: number | null; error: string | null }>;
  markNotificationAsRead?: (notificationId: string) => Promise<{ error: string | null }>;
  markAllNotificationsAsRead?: () => Promise<{ error: string | null }>;
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
