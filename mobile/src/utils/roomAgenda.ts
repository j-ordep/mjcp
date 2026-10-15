import type { RoomDailyAgendaItem } from "../services/roomReservationService";
import { getEventCategoryLabel } from "./eventCategory";

export interface RoomAgendaDisplayItem {
  id: string;
  title: string;
  categoryLabel: string;
  timeLabel: string;
  badgeLabel: string | null;
  isPrimary: boolean;
}

interface BuildRoomAgendaDisplayItemsOptions {
  excludeReservationId?: string | null;
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

export function buildRoomAgendaDisplayItems(
  items: RoomDailyAgendaItem[],
  options: BuildRoomAgendaDisplayItemsOptions = {},
): RoomAgendaDisplayItem[] {
  const filteredItems = options.excludeReservationId
    ? items.filter((item) => item.id !== options.excludeReservationId)
    : items;

  return filteredItems.map((item, index) => ({
    id: item.id,
    title: item.purpose?.trim() || "Reserva ativa",
    categoryLabel: getEventCategoryLabel(item.category),
    timeLabel: `${formatTimeLabel(item.startAt)} - ${formatTimeLabel(item.endAt)}`,
    badgeLabel: item.isEventLinked ? "Evento" : null,
    isPrimary: index === 0,
  }));
}
