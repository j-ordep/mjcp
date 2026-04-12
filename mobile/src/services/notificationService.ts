import { supabase } from "../lib/supabase";
import type { Notification } from "../types/models";

export interface AppNotification extends Notification {
  user_id: string;
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Ocorreu um erro inesperado.";
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
      data: (data ?? []) as AppNotification[],
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
