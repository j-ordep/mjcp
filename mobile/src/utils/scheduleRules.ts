import type { AssignmentStatus } from "../types/database.types";
import type { AssignmentWarning } from "../services/scheduleService";

export type ScheduleTimeFilter = "current" | "past";

function getScheduleDayTimestamp(startAtIso: string) {
  const eventDate = new Date(startAtIso);
  eventDate.setHours(0, 0, 0, 0);
  return eventDate.getTime();
}

export function countAssignmentsByStatus(
  assignments: { status: AssignmentStatus }[] | null | undefined,
) {
  const base = { total: 0, pending: 0, confirmed: 0 };

  (assignments ?? []).forEach((assignment) => {
    base.total += 1;
    if (assignment.status === "pending") base.pending += 1;
    if (assignment.status === "confirmed") base.confirmed += 1;
  });

  return base;
}

export function isEventDateEditable(startAtIso: string, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return getScheduleDayTimestamp(startAtIso) >= today.getTime();
}

export function isEventDateReadOnly(startAtIso: string, now = new Date()) {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  return getScheduleDayTimestamp(startAtIso) <= today.getTime();
}

export function matchesScheduleTimeFilter(
  startAtIso: string,
  filter: ScheduleTimeFilter,
  now = new Date(),
) {
  const isReadOnly = isEventDateReadOnly(startAtIso, now);
  return filter === "current" ? !isReadOnly : isReadOnly;
}

export function compareScheduleDatesByFilter(
  leftStartAtIso: string,
  rightStartAtIso: string,
  filter: ScheduleTimeFilter,
) {
  const leftTimestamp = new Date(leftStartAtIso).getTime();
  const rightTimestamp = new Date(rightStartAtIso).getTime();

  return filter === "past"
    ? rightTimestamp - leftTimestamp
    : leftTimestamp - rightTimestamp;
}

export function toISODateString(dateIso: string) {
  const d = new Date(dateIso);
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function rangesOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
) {
  return aStart.getTime() < bEnd.getTime() && aEnd.getTime() > bStart.getTime();
}

export function buildAssignmentWarningsMessage(warnings: AssignmentWarning[]) {
  const blocked = warnings.filter((warning) => warning.type === "blocked_date");
  const conflicts = warnings.filter((warning) => warning.type === "conflict");
  const parts: string[] = [];

  if (blocked.length > 0) {
    parts.push(`Data bloqueada pelo membro: ${blocked[0].date}.`);
  }

  if (conflicts.length > 0) {
    const lines = conflicts.slice(0, 2).map((conflict) => {
      const ministry = conflict.ministry_name ? ` (${conflict.ministry_name})` : "";
      const role = conflict.role_name ? ` - ${conflict.role_name}` : "";
      return `Conflito: ${conflict.event_title}${ministry}${role}`;
    });
    parts.push(lines.join("\n"));
    if (conflicts.length > 2) {
      parts.push(`Mais ${conflicts.length - 2} conflito(s).`);
    }
  }

  return parts.join("\n");
}
