import test from "node:test";
import assert from "node:assert/strict";

import { createQueryBuilder, loadServiceModule } from "./serviceTestHelpers";

type NotificationServiceModule = {
  getNotifications: (limit?: number) => Promise<{
    data: Array<{
      id: string;
      type: string;
      read: boolean;
      payload: unknown;
    }> | null;
    error: string | null;
  }>;
  markNotificationAsRead: (notificationId: string) => Promise<{
    error: string | null;
  }>;
  markAllNotificationsAsRead: () => Promise<{
    error: string | null;
  }>;
  subscribeToNotifications: (input: {
    userId: string;
    onInsert?: (notification: {
      id: string;
      payload: unknown;
      read: boolean;
    }) => void;
    onUpdate?: (notification: {
      id: string;
      payload: unknown;
      read: boolean;
    }) => void;
  }) => {
    unsubscribe: () => Promise<void> | void;
  };
};

test("getNotifications normalizes payloads returned from Supabase", async () => {
  const notificationService = loadServiceModule<NotificationServiceModule>(
    "../src/services/notificationService",
    {
      from: () =>
        createQueryBuilder({
          select: {
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
                read: false,
                created_at: "2026-05-22T00:00:00.000Z",
              },
            ],
            error: null,
          },
        }),
    },
  );

  const result = await notificationService.getNotifications();

  assert.equal(result.error, null);
  assert.equal(result.data?.[0]?.id, "notification-1");
  assert.deepEqual(result.data?.[0]?.payload, {
    action: "assigned",
    schedule_id: "schedule-1",
    event_id: "event-1",
    ministry_id: "ministry-1",
    assignment_id: "assignment-1",
    role_id: "role-1",
  });
});

test("markNotificationAsRead and markAllNotificationsAsRead return backend errors", async () => {
  const notificationService = loadServiceModule<NotificationServiceModule>(
    "../src/services/notificationService",
    {
      from: () =>
        createQueryBuilder({
          update: {
            data: null,
            error: { message: "Falha no update" },
          },
        }),
    },
  );

  const singleResult = await notificationService.markNotificationAsRead("notification-1");
  const allResult = await notificationService.markAllNotificationsAsRead();

  assert.equal(singleResult.error, "Falha no update");
  assert.equal(allResult.error, "Falha no update");
});

test("subscribeToNotifications emits normalized insert and update events and unsubscribes", async () => {
  const handlers: Record<string, (payload: { new: Record<string, unknown> }) => void> = {};
  const channel = {
    on: (
      eventType: string,
      filter: { event: string },
      callback: (payload: { new: Record<string, unknown> }) => void,
    ) => {
      handlers[`${eventType}:${filter.event}`] = callback;
      return channel;
    },
    subscribe: () => channel,
  };
  let removedChannel: unknown = null;

  const notificationService = loadServiceModule<NotificationServiceModule>(
    "../src/services/notificationService",
    {
      from: () => createQueryBuilder(),
      channel: () => channel,
      removeChannel: async (value: unknown) => {
        removedChannel = value;
      },
    },
  );

  const inserts: unknown[] = [];
  const updates: unknown[] = [];

  const subscription = notificationService.subscribeToNotifications({
    userId: "user-1",
    onInsert: (notification) => {
      inserts.push(notification);
    },
    onUpdate: (notification) => {
      updates.push(notification);
    },
  });

  handlers["postgres_changes:INSERT"]({
    new: {
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
      read: false,
      created_at: "2026-05-22T00:00:00.000Z",
    },
  });

  handlers["postgres_changes:UPDATE"]({
    new: {
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
      read: true,
      created_at: "2026-05-22T00:00:00.000Z",
    },
  });

  assert.equal(inserts.length, 1);
  assert.equal(updates.length, 1);
  assert.deepEqual((inserts[0] as { payload: unknown }).payload, {
    action: "assigned",
    schedule_id: "schedule-1",
    event_id: "event-1",
    ministry_id: "ministry-1",
    assignment_id: "assignment-1",
    role_id: "role-1",
  });
  assert.equal((updates[0] as { read: boolean }).read, true);

  await subscription.unsubscribe();
  assert.equal(removedChannel, channel);
});
