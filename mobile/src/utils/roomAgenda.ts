import type { RoomDailyAgendaItem } from "../services/roomReservationService";
import { getEventCategoryLabel } from "./eventCategory";

export interface RoomAgendaDisplayItem {
  id: string;
  title: string;
  categoryLabel: string;
  timeLabel: string;
  badgeLabel: string | null;
  scheduleSummaryLabel: string | null;
  isPrimary: boolean;
}

function formatTimeLabel(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }

  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function buildScheduleSummaryLabel(item: RoomDailyAgendaItem) {
  if (!item.linkedScheduleSummary) {
    return null;
  }

  return `Escalas vinculadas: ${[
    pluralize(item.linkedScheduleSummary.schedulesCount, "ministério", "ministérios"),
    pluralize(item.linkedScheduleSummary.assignmentsCount, "pessoa", "pessoas"),
    `${item.linkedScheduleSummary.confirmedAssignmentsCount} confirmadas`,
  ].join(" · ")}`;
}

export function buildRoomAgendaDisplayItems(items: RoomDailyAgendaItem[]): RoomAgendaDisplayItem[] {
  return items.map((item, index) => ({
    id: item.id,
    title: item.purpose?.trim() || "Reserva ativa",
    categoryLabel: getEventCategoryLabel(item.category),
    timeLabel: `${formatTimeLabel(item.startAt)} - ${formatTimeLabel(item.endAt)}`,
    badgeLabel: item.isEventLinked ? "Evento" : null,
    scheduleSummaryLabel: buildScheduleSummaryLabel(item),
    isPrimary: index === 0,
  }));
}
