import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import type {
  NotificationType,
  TableRow,
} from "../types/database.types";
import {
  parseNotificationPayload,
  type NotificationPayload,
} from "../types/notifications";

export type NotificationRecord = TableRow<"notifications">;

export interface AppNotification extends NotificationRecord {
  payload: NotificationPayload | null;
}

interface NotificationRealtimeHandlers {
  userId: string;
  onInsert?: (notification: AppNotification) => void;
  onUpdate?: (notification: AppNotification) => void;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }
  return "Ocorreu um erro inesperado.";
}

function normalizeNotificationRecord(record: NotificationRecord): AppNotification {
  return {
    ...record,
    payload: parseNotificationPayload(
      record.type as NotificationType,
      record.data,
    ),
  };
}

export async function getNotifications(limit: number = 50) {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return {
      data: ((data ?? []) as NotificationRecord[]).map(normalizeNotificationRecord),
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", notificationId)
      .eq("read", false);

    if (error) throw error;

    return { error: null };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false);

    if (error) throw error;

    return { error: null };
  } catch (error: unknown) {
    return { error: getErrorMessage(error) };
  }
}

export async function getUnreadNotificationsCount() {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("read", false);

    if (error) throw error;

    return { data: count ?? 0, error: null };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export function subscribeToNotifications({
  userId,
  onInsert,
  onUpdate,
}: NotificationRealtimeHandlers) {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload: { new: NotificationRecord }) => {
        onInsert?.(normalizeNotificationRecord(payload.new));
      },
    )
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "notifications",
        filter: `user_id=eq.${userId}`,
      },
      (payload: { new: NotificationRecord }) => {
        onUpdate?.(normalizeNotificationRecord(payload.new));
      },
    )
    .subscribe();

  return {
    unsubscribe: () => supabase.removeChannel(channel as RealtimeChannel),
  };
}
