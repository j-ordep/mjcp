import type { Json, NotificationType } from "./database.types";

export interface SwapRequestNotificationData {
  action: "created" | "accepted" | "cancelled";
  swap_request_id: string;
  schedule_id: string;
  event_id: string;
  ministry_id: string;
  assignment_id: string;
  role_id: string;
  actor_user_id: string;
}

export interface ScheduleNotificationData {
  action: "assigned";
  schedule_id: string;
  event_id: string;
  ministry_id: string;
  assignment_id: string;
  role_id: string;
}

export type NotificationPayload =
  | SwapRequestNotificationData
  | ScheduleNotificationData;

export type NotificationNavigationTarget =
  | {
      screen: "SwapRequests";
      params?: undefined;
    }
  | {
      screen: "EditSchedule";
      params: {
        scheduleId: string;
      };
    };

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readStringField(
  value: Record<string, unknown>,
  key: string,
): string | null {
  return typeof value[key] === "string" && value[key].length > 0
    ? value[key]
    : null;
}

function parseScheduleNotificationData(
  data: unknown,
): ScheduleNotificationData | null {
  if (!isObjectRecord(data) || data.action !== "assigned") {
    return null;
  }

  const scheduleId = readStringField(data, "schedule_id");
  const eventId = readStringField(data, "event_id");
  const ministryId = readStringField(data, "ministry_id");
  const assignmentId = readStringField(data, "assignment_id");
  const roleId = readStringField(data, "role_id");

  if (!scheduleId || !eventId || !ministryId || !assignmentId || !roleId) {
    return null;
  }

  return {
    action: "assigned",
    schedule_id: scheduleId,
    event_id: eventId,
    ministry_id: ministryId,
    assignment_id: assignmentId,
    role_id: roleId,
  };
}

function parseSwapRequestNotificationData(
  data: unknown,
): SwapRequestNotificationData | null {
  if (
    !isObjectRecord(data) ||
    (data.action !== "created" &&
      data.action !== "accepted" &&
      data.action !== "cancelled")
  ) {
    return null;
  }

  const swapRequestId = readStringField(data, "swap_request_id");
  const scheduleId = readStringField(data, "schedule_id");
  const eventId = readStringField(data, "event_id");
  const ministryId = readStringField(data, "ministry_id");
  const assignmentId = readStringField(data, "assignment_id");
  const roleId = readStringField(data, "role_id");
  const actorUserId = readStringField(data, "actor_user_id");

  if (
    !swapRequestId ||
    !scheduleId ||
    !eventId ||
    !ministryId ||
    !assignmentId ||
    !roleId ||
    !actorUserId
  ) {
    return null;
  }

  return {
    action: data.action,
    swap_request_id: swapRequestId,
    schedule_id: scheduleId,
    event_id: eventId,
    ministry_id: ministryId,
    assignment_id: assignmentId,
    role_id: roleId,
    actor_user_id: actorUserId,
  };
}

export function parseNotificationPayload(
  type: NotificationType | string,
  data: Json | unknown,
): NotificationPayload | null {
  if (type === "schedule") {
    return parseScheduleNotificationData(data);
  }

  if (type === "swap_request") {
    return parseSwapRequestNotificationData(data);
  }

  return null;
}

export function getNotificationNavigationTarget(input: {
  type: NotificationType | string;
  data: Json | unknown;
}): NotificationNavigationTarget | null {
  const payload = parseNotificationPayload(input.type, input.data);

  if (!payload) {
    return null;
  }

  if (input.type === "schedule") {
    return {
      screen: "EditSchedule",
      params: {
        scheduleId: payload.schedule_id,
      },
    };
  }

  if (input.type === "swap_request") {
    return {
      screen: "SwapRequests",
    };
  }

  return null;
}
