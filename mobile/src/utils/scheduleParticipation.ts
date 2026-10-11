import { isEventDateEditable } from "./scheduleRules";

export type SwapRequestFilter = "mine" | "available" | "history";

interface SwapRequestLike {
  status: string;
  from_assignment: { user_id: string; event_start_at: string } | null;
}

export function filterSwapRequests<T extends SwapRequestLike>(
  items: T[], filter: SwapRequestFilter, userId?: string | null,
) {
  if (!userId) return [];
  return items.filter((item) => {
    if (filter === "history") return item.status !== "pending";
    if (item.status !== "pending" || !item.from_assignment) return false;
    return filter === "mine"
      ? item.from_assignment.user_id === userId
      : item.from_assignment.user_id !== userId;
  });
}

export function canActOnSwapRequest(item: SwapRequestLike, now = new Date()) {
  return item.status === "pending" && !!item.from_assignment &&
    isEventDateEditable(item.from_assignment.event_start_at, now);
}

export interface ScheduleParticipationLike {
  id: string;
  user_id: string;
  status: string;
  role_name: string;
}

export function getOwnAssignments<T extends ScheduleParticipationLike>(
  assignments: T[],
  userId?: string | null,
) {
  if (!userId) return [];
  return assignments.filter((assignment) => assignment.user_id === userId);
}

export function hasConfirmableAssignments<T extends { status: string }>(
  assignments: T[],
) {
  return assignments.some((assignment) => assignment.status === "pending");
}

export function getParticipationStatusLabel<T extends { status: string }>(
  assignments: T[],
) {
  if (assignments.length === 0) return "Sem participacao";

  const statuses = new Set(assignments.map((assignment) => assignment.status));

  if (statuses.has("pending")) return "Pendente";
  if (statuses.size === 1 && statuses.has("confirmed")) return "Confirmado";
  if (statuses.size === 1 && statuses.has("swapped")) return "Trocado";
  if (statuses.size === 1 && statuses.has("declined")) return "Recusado";
  if (statuses.has("confirmed")) return "Parcialmente confirmado";
  if (statuses.has("swapped")) return "Trocado";
  if (statuses.has("declined")) return "Recusado";

  return "Pendente";
}

export function getOwnRoleLabel<T extends { role_name: string }>(
  assignments: T[],
) {
  return assignments.map((assignment) => assignment.role_name).join(", ");
}
