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

export function hasPendingAssignments<T extends { status: string }>(
  assignments: T[],
) {
  return assignments.some((assignment) => assignment.status !== "confirmed");
}

export function getOwnRoleLabel<T extends { role_name: string }>(
  assignments: T[],
) {
  return assignments.map((assignment) => assignment.role_name).join(", ");
}
