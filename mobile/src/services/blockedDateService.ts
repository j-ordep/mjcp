import { supabase } from "../lib/supabase";
import type { TableRow } from "../types/database.types";

export type BlockedDateRecord = TableRow<"blocked_dates">;

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
  return "Erro inesperado.";
}

function normalizeBlockedDates(dates: string[]) {
  return Array.from(
    new Set(
      dates
        .map((date) => date.trim())
        .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date)),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

export async function listBlockedDatesForUser(userId: string) {
  try {
    if (!userId) {
      throw new Error("Usuario nao autenticado.");
    }

    const { data, error } = await supabase
      .from("blocked_dates")
      .select("id,user_id,date,reason,created_at")
      .eq("user_id", userId)
      .order("date", { ascending: true });

    if (error) throw error;

    return {
      data: (data ?? []) as BlockedDateRecord[],
      error: null,
    };
  } catch (error: unknown) {
    return { data: null, error: getErrorMessage(error) };
  }
}

export async function syncBlockedDatesForUser(userId: string, dates: string[]) {
  try {
    if (!userId) {
      throw new Error("Usuario nao autenticado.");
    }

    const normalizedDates = normalizeBlockedDates(dates);
    const currentResult = await listBlockedDatesForUser(userId);

    if (currentResult.error) {
      throw new Error(currentResult.error);
    }

    const currentDates = new Set(
      (currentResult.data ?? []).map((blockedDate) => blockedDate.date),
    );
    const nextDates = new Set(normalizedDates);

    const addedDates = normalizedDates.filter((date) => !currentDates.has(date));
    const removedDates = Array.from(currentDates)
      .filter((date) => !nextDates.has(date))
      .sort((left, right) => left.localeCompare(right));

    if (addedDates.length > 0) {
      const { error } = await supabase.from("blocked_dates").insert(
        addedDates.map((date) => ({
          user_id: userId,
          date,
        })),
      );

      if (error) throw error;
    }

    if (removedDates.length > 0) {
      const { error } = await supabase
        .from("blocked_dates")
        .delete()
        .eq("user_id", userId)
        .in("date", removedDates);

      if (error) throw error;
    }

    return {
      data: {
        addedDates,
        removedDates,
      },
      error: null,
    };
  } catch (error: unknown) {
    return {
      data: null,
      error: getErrorMessage(error),
    };
  }
}
