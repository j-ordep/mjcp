import test from "node:test";
import assert from "node:assert/strict";

interface NotificationNavigationTarget {
  screen: "SwapRequests" | "EditSchedule";
  params?: {
    scheduleId: string;
  };
}

function loadNotificationModule() {
  return require("../src/types/notifications") as {
    parseNotificationPayload: (type: string, data: unknown) => unknown;
    getNotificationNavigationTarget: (input: {
      type: string;
      data: unknown;
    }) => NotificationNavigationTarget | null;
  };
}

test("parseNotificationPayload normalizes a valid schedule notification payload", () => {
  const notifications = loadNotificationModule();

  const payload = notifications.parseNotificationPayload("schedule", {
    action: "assigned",
    schedule_id: "schedule-1",
    event_id: "event-1",
    ministry_id: "ministry-1",
    assignment_id: "assignment-1",
    role_id: "role-1",
  });

  assert.deepEqual(payload, {
    action: "assigned",
    schedule_id: "schedule-1",
    event_id: "event-1",
    ministry_id: "ministry-1",
    assignment_id: "assignment-1",
    role_id: "role-1",
  });
});

test("parseNotificationPayload returns null for an invalid swap notification payload", () => {
  const notifications = loadNotificationModule();

  const payload = notifications.parseNotificationPayload("swap_request", {
    action: "created",
    swap_request_id: "swap-1",
  });

  assert.equal(payload, null);
});

test("getNotificationNavigationTarget resolves schedule and swap notification routes safely", () => {
  const notifications = loadNotificationModule();

  assert.deepEqual(
    notifications.getNotificationNavigationTarget({
      type: "schedule",
      data: {
        action: "assigned",
        schedule_id: "schedule-1",
        event_id: "event-1",
        ministry_id: "ministry-1",
        assignment_id: "assignment-1",
        role_id: "role-1",
      },
    }),
    {
      screen: "EditSchedule",
      params: { scheduleId: "schedule-1" },
    },
  );

  assert.deepEqual(
    notifications.getNotificationNavigationTarget({
      type: "swap_request",
      data: {
        action: "accepted",
        swap_request_id: "swap-1",
        schedule_id: "schedule-2",
        event_id: "event-2",
        ministry_id: "ministry-2",
        assignment_id: "assignment-2",
        role_id: "role-2",
        actor_user_id: "user-2",
      },
    }),
    {
      screen: "SwapRequests",
    },
  );

  assert.equal(
    notifications.getNotificationNavigationTarget({
      type: "schedule",
      data: {
        action: "assigned",
      },
    }),
    null,
  );
});
