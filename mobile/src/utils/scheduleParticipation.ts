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
