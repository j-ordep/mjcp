import test from "node:test";
import assert from "node:assert/strict";
import type { RoomDailyAgendaItem } from "../src/services/roomReservationService";
import { buildRoomAgendaDisplayItems } from "../src/utils/roomAgenda";

function createAgendaItem(
  input: Partial<RoomDailyAgendaItem> & Pick<RoomDailyAgendaItem, "id" | "roomId">,
): RoomDailyAgendaItem {
  return {
    id: input.id,
    roomId: input.roomId,
    startAt: input.startAt ?? "2026-05-05T19:00:00-03:00",
    endAt: input.endAt ?? "2026-05-05T21:00:00-03:00",
    purpose: input.purpose ?? "Culto da noite",
    category: input.category ?? "culto",
    eventId: input.eventId ?? null,
    isEventLinked: input.isEventLinked ?? false,
    linkedScheduleSummary: input.linkedScheduleSummary ?? null,
  };
}

test("buildRoomAgendaDisplayItems adds event badge and linked schedule summary for event reservations", () => {
  const items = buildRoomAgendaDisplayItems([
    createAgendaItem({
      id: "reservation-1",
      roomId: "room-1",
      eventId: "event-1",
      isEventLinked: true,
      linkedScheduleSummary: {
        schedulesCount: 2,
        assignmentsCount: 5,
        confirmedAssignmentsCount: 3,
        pendingAssignmentsCount: 2,
      },
    }),
  ]);

  assert.deepEqual(items[0], {
    id: "reservation-1",
    badgeLabel: "Evento",
    categoryLabel: "Culto",
    isPrimary: true,
    scheduleSummaryLabel: "Escalas vinculadas: 2 ministérios · 5 pessoas · 3 confirmadas",
    timeLabel: "19:00 - 21:00",
    title: "Culto da noite",
  });
});

test("buildRoomAgendaDisplayItems keeps standalone reservations without event badge", () => {
  const items = buildRoomAgendaDisplayItems([
    createAgendaItem({
      id: "reservation-2",
      roomId: "room-2",
      purpose: "Reunião de alinhamento",
      category: "reunião",
    }),
  ]);

  assert.deepEqual(items[0], {
    id: "reservation-2",
    badgeLabel: null,
    categoryLabel: "Reunião",
    isPrimary: true,
    scheduleSummaryLabel: null,
    timeLabel: "19:00 - 21:00",
    title: "Reunião de alinhamento",
  });
});

test("buildRoomAgendaDisplayItems marks only first reservation as primary", () => {
  const items = buildRoomAgendaDisplayItems([
    createAgendaItem({
      id: "reservation-1",
      roomId: "room-1",
      startAt: "2026-05-05T08:00:00-03:00",
      endAt: "2026-05-05T09:00:00-03:00",
    }),
    createAgendaItem({
      id: "reservation-2",
      roomId: "room-1",
      startAt: "2026-05-05T10:00:00-03:00",
      endAt: "2026-05-05T11:00:00-03:00",
    }),
  ]);

  assert.equal(items[0].isPrimary, true);
  assert.equal(items[1].isPrimary, false);
});
