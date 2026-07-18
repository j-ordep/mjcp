import test from "node:test";
import assert from "node:assert/strict";
import type { RoomAvailability } from "../src/services/roomReservationService";
import {
  canCancelStandaloneRoomAgendaItem,
  canCreateStandaloneRoomReservation,
  getRoomIdForEditSave,
  getNextSelectedRoomId,
  getRefreshAvailabilityWindow,
  reconcileRoomSelection,
  shouldApplyAvailabilityResponse,
} from "../src/utils/roomAvailability";

function createRoom(input: Partial<RoomAvailability> & Pick<RoomAvailability, "id" | "status">) {
  return {
    id: input.id,
    name: input.name ?? `Sala ${input.id}`,
    capacity: input.capacity ?? 10,
    description: input.description ?? null,
    status: input.status,
    reservation: input.reservation ?? null,
  } satisfies RoomAvailability;
}

test("getNextSelectedRoomId keeps the current selection when the room stays available", () => {
  const nextSelectedRoomId = getNextSelectedRoomId({
    selectedRoomId: "room-1",
    rooms: [createRoom({ id: "room-1", status: "available" })],
    currentEventId: "event-1",
  });

  assert.equal(nextSelectedRoomId, "room-1");
});

test("getNextSelectedRoomId clears the selection when the room becomes occupied by another event", () => {
  const nextSelectedRoomId = getNextSelectedRoomId({
    selectedRoomId: "room-1",
    rooms: [
      createRoom({
        id: "room-1",
        status: "occupied",
        reservation: {
          id: "reservation-1",
          room_id: "room-1",
          event_id: "event-2",
          reserved_by: "user-1",
          start_at: "2026-05-04T19:00:00.000Z",
          end_at: "2026-05-04T22:00:00.000Z",
          purpose: "Outro evento",
          category: "geral",
          status: "active",
          created_at: "2026-05-01T10:00:00.000Z",
        },
      }),
    ],
    currentEventId: "event-1",
  });

  assert.equal(nextSelectedRoomId, null);
});

test("getNextSelectedRoomId preserves the room when the active reservation is still linked to the same event", () => {
  const nextSelectedRoomId = getNextSelectedRoomId({
    selectedRoomId: "room-1",
    rooms: [
      createRoom({
        id: "room-1",
        status: "occupied",
        reservation: {
          id: "reservation-1",
          room_id: "room-1",
          event_id: "event-1",
          reserved_by: "user-1",
          start_at: "2026-05-04T19:00:00.000Z",
          end_at: "2026-05-04T22:00:00.000Z",
          purpose: "Mesmo evento",
          category: "geral",
          status: "active",
          created_at: "2026-05-01T10:00:00.000Z",
        },
      }),
    ],
    currentEventId: "event-1",
  });

  assert.equal(nextSelectedRoomId, "room-1");
});

test("shouldApplyAvailabilityResponse accepts only the latest request", () => {
  assert.equal(
    shouldApplyAvailabilityResponse({
      requestId: 1,
      latestRequestId: 2,
    }),
    false,
  );
  assert.equal(
    shouldApplyAvailabilityResponse({
      requestId: 2,
      latestRequestId: 2,
    }),
    true,
  );
});

test("getRefreshAvailabilityWindow prefers the latest visible window over a stale captured one", () => {
  const staleWindow = {
    startAt: "2026-05-04T19:00:00.000Z",
    endAt: "2026-05-04T22:00:00.000Z",
  };
  const latestWindow = {
    startAt: "2026-05-05T20:00:00.000Z",
    endAt: "2026-05-05T23:00:00.000Z",
  };

  assert.deepEqual(
    getRefreshAvailabilityWindow({
      latestWindow,
      fallbackWindow: staleWindow,
    }),
    latestWindow,
  );
});

test("getRefreshAvailabilityWindow keeps a latest null window instead of falling back to a stale one", () => {
  const staleWindow = {
    startAt: "2026-05-04T19:00:00.000Z",
    endAt: "2026-05-04T22:00:00.000Z",
  };

  assert.equal(
    getRefreshAvailabilityWindow({
      latestWindow: null,
      fallbackWindow: staleWindow,
    }),
    null,
  );
});

test("reconcileRoomSelection restores the linked room after a temporary auto-clear when the original window comes back", () => {
  const intermediateState = reconcileRoomSelection({
    selectedRoomId: "room-1",
    linkedRoomId: "room-1",
    rooms: [
      createRoom({
        id: "room-1",
        status: "occupied",
        reservation: {
          id: "reservation-1",
          room_id: "room-1",
          event_id: "event-2",
          reserved_by: "user-1",
          start_at: "2026-05-04T19:00:00.000Z",
          end_at: "2026-05-04T22:00:00.000Z",
          purpose: "Outro evento",
          category: "geral",
          status: "active",
          created_at: "2026-05-01T10:00:00.000Z",
        },
      }),
    ],
    currentEventId: "event-1",
    hasManualRoomSelectionChange: false,
  });

  assert.deepEqual(intermediateState, {
    selectedRoomId: null,
    isRoomSelectionAutoCleared: true,
  });

  const restoredState = reconcileRoomSelection({
    selectedRoomId: intermediateState.selectedRoomId,
    linkedRoomId: "room-1",
    rooms: [
      createRoom({
        id: "room-1",
        status: "occupied",
        reservation: {
          id: "reservation-2",
          room_id: "room-1",
          event_id: "event-1",
          reserved_by: "user-1",
          start_at: "2026-05-11T19:00:00.000Z",
          end_at: "2026-05-11T22:00:00.000Z",
          purpose: "Mesmo evento",
          category: "geral",
          status: "active",
          created_at: "2026-05-01T11:00:00.000Z",
        },
      }),
    ],
    currentEventId: "event-1",
    hasManualRoomSelectionChange: false,
  });

  assert.deepEqual(restoredState, {
    selectedRoomId: "room-1",
    isRoomSelectionAutoCleared: false,
  });
});

test("reconcileRoomSelection keeps manual clear even if linked room becomes available again", () => {
  const state = reconcileRoomSelection({
    selectedRoomId: null,
    linkedRoomId: "room-1",
    rooms: [
      createRoom({
        id: "room-1",
        status: "occupied",
        reservation: {
          id: "reservation-2",
          room_id: "room-1",
          event_id: "event-1",
          reserved_by: "user-1",
          start_at: "2026-05-11T19:00:00.000Z",
          end_at: "2026-05-11T22:00:00.000Z",
          purpose: "Mesmo evento",
          category: "geral",
          status: "active",
          created_at: "2026-05-01T11:00:00.000Z",
        },
      }),
    ],
    currentEventId: "event-1",
    hasManualRoomSelectionChange: true,
  });

  assert.deepEqual(state, {
    selectedRoomId: null,
    isRoomSelectionAutoCleared: false,
  });
});

test("getRoomIdForEditSave distinguishes preserve, auto-clear, and manual room changes", () => {
  assert.equal(
    getRoomIdForEditSave({
      selectedRoomId: "room-1",
      hasManualRoomSelectionChange: false,
      isRoomSelectionAutoCleared: false,
    }),
    undefined,
  );
  assert.equal(
    getRoomIdForEditSave({
      selectedRoomId: null,
      hasManualRoomSelectionChange: false,
      isRoomSelectionAutoCleared: true,
    }),
    null,
  );
  assert.equal(
    getRoomIdForEditSave({
      selectedRoomId: null,
      hasManualRoomSelectionChange: true,
      isRoomSelectionAutoCleared: false,
    }),
    null,
  );
  assert.equal(
    getRoomIdForEditSave({
      selectedRoomId: "room-2",
      hasManualRoomSelectionChange: true,
      isRoomSelectionAutoCleared: false,
    }),
    "room-2",
  );
});

test("canCreateStandaloneRoomReservation requires trimmed title and valid window", () => {
  assert.equal(
    canCreateStandaloneRoomReservation({
      title: "  Reunião do louvor  ",
      reservationWindow: {
        startAt: "2026-05-05T19:00:00.000Z",
        endAt: "2026-05-05T21:00:00.000Z",
      },
    }),
    true,
  );

  assert.equal(
    canCreateStandaloneRoomReservation({
      title: "   ",
      reservationWindow: {
        startAt: "2026-05-05T19:00:00.000Z",
        endAt: "2026-05-05T21:00:00.000Z",
      },
    }),
    false,
  );

  assert.equal(
    canCreateStandaloneRoomReservation({
      title: "Reserva",
      reservationWindow: null,
    }),
    false,
  );
});

test("canCancelStandaloneRoomAgendaItem allows cancelling only the current user's standalone reservation", () => {
  assert.equal(
    canCancelStandaloneRoomAgendaItem({
      currentUserId: "user-1",
      reservation: {
        id: "reservation-1",
        roomId: "room-1",
        startAt: "2026-05-05T19:00:00.000Z",
        endAt: "2026-05-05T21:00:00.000Z",
        purpose: "ReuniÃ£o",
        category: "reuniÃ£o",
        eventId: null,
        isEventLinked: false,
        linkedScheduleSummary: null,
        reservedBy: "user-1",
      },
    }),
    true,
  );

  assert.equal(
    canCancelStandaloneRoomAgendaItem({
      currentUserId: "user-1",
      reservation: {
        id: "reservation-2",
        roomId: "room-1",
        startAt: "2026-05-05T19:00:00.000Z",
        endAt: "2026-05-05T21:00:00.000Z",
        purpose: "Culto",
        category: "culto",
        eventId: "event-1",
        isEventLinked: true,
        linkedScheduleSummary: null,
        reservedBy: "user-1",
      },
    }),
    false,
  );

  assert.equal(
    canCancelStandaloneRoomAgendaItem({
      currentUserId: "user-1",
      reservation: {
        id: "reservation-3",
        roomId: "room-1",
        startAt: "2026-05-05T19:00:00.000Z",
        endAt: "2026-05-05T21:00:00.000Z",
        purpose: "ReuniÃ£o",
        category: "reuniÃ£o",
        eventId: null,
        isEventLinked: false,
        linkedScheduleSummary: null,
        reservedBy: "user-2",
      },
    }),
    false,
  );
});
