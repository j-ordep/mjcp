import test from "node:test";
import assert from "node:assert/strict";

import { createQueryBuilder, loadServiceModule } from "./serviceTestHelpers";

type NotificationServiceModule = {
  getNotifications: (userId: string, limit?: number) => Promise<{
    data: Array<{
      id: string;
      type: string;
      read: boolean;
      payload: unknown;
    }> | null;
    error: string | null;
  }>;
  markNotificationAsRead: (notificationId: string, userId: string) => Promise<{
    error: string | null;
  }>;
  markAllNotificationsAsRead: (userId: string) => Promise<{
    error: string | null;
  }>;
  getUnreadNotificationsCount: (userId: string) => Promise<{ data: number | null; error: string | null }>;
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

  const result = await notificationService.getNotifications("user-1");

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

  const singleResult = await notificationService.markNotificationAsRead("notification-1", "user-1");
  const allResult = await notificationService.markAllNotificationsAsRead("user-1");

  assert.equal(singleResult.error, "Falha no update");
  assert.equal(allResult.error, "Falha no update");
});

for (const operation of ["list", "count", "read", "readAll"] as const) {
  test(`notification ${operation} explicitly scopes the query to the requested user`, async () => {
    const builder = createQueryBuilder({ select: { data: [] } });
    const filters: unknown[][] = [];
    builder.eq = (...args: unknown[]) => { filters.push(args); return builder; };
    const service = loadServiceModule<NotificationServiceModule>("../src/services/notificationService", {
      from: () => builder,
    });
    if (operation === "list") await service.getNotifications("user-1", 10);
    if (operation === "count") await service.getUnreadNotificationsCount("user-1");
    if (operation === "read") await service.markNotificationAsRead("notification-1", "user-1");
    if (operation === "readAll") await service.markAllNotificationsAsRead("user-1");
    assert.ok(filters.some(([column, value]) => column === "user_id" && value === "user-1"));
  });

  test(`notification ${operation} rejects a missing user before accessing the database`, async () => {
    let requests = 0;
    const service = loadServiceModule<NotificationServiceModule>("../src/services/notificationService", {
      from: () => { requests++; return createQueryBuilder(); },
    });
    const result = operation === "list" ? await service.getNotifications("") :
      operation === "count" ? await service.getUnreadNotificationsCount("") :
      operation === "read" ? await service.markNotificationAsRead("notification-1", "") :
      await service.markAllNotificationsAsRead("");
    assert.equal(requests, 0);
    assert.ok(result.error);
  });
}

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
