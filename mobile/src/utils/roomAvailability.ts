import type { RoomAvailability } from "../services/roomReservationService";

export function isRoomSelectable(
  room: RoomAvailability,
  currentEventId?: string,
) {
  return room.status === "available" || room.reservation?.event_id === currentEventId;
}

export function getNextSelectedRoomId(input: {
  selectedRoomId: string | null;
  rooms: RoomAvailability[];
  currentEventId?: string;
}) {
  if (input.selectedRoomId == null) {
    return null;
  }

  const selectedRoom = input.rooms.find((room) => room.id === input.selectedRoomId);
  if (!selectedRoom) {
    return null;
  }

  return isRoomSelectable(selectedRoom, input.currentEventId)
    ? input.selectedRoomId
    : null;
}

export function reconcileRoomSelection(input: {
  selectedRoomId: string | null;
  linkedRoomId: string | null;
  rooms: RoomAvailability[];
  currentEventId?: string;
  hasManualRoomSelectionChange: boolean;
}) {
  const selectedRoom =
    input.selectedRoomId != null
      ? input.rooms.find((room) => room.id === input.selectedRoomId) ?? null
      : null;
  const linkedRoom =
    input.linkedRoomId != null
      ? input.rooms.find((room) => room.id === input.linkedRoomId) ?? null
      : null;

  const isSelectedRoomSelectable =
    selectedRoom != null
      ? isRoomSelectable(selectedRoom, input.currentEventId)
      : false;
  const isLinkedRoomSelectable =
    linkedRoom != null
      ? isRoomSelectable(linkedRoom, input.currentEventId)
      : false;

  if (input.hasManualRoomSelectionChange) {
    return {
      selectedRoomId: isSelectedRoomSelectable ? input.selectedRoomId : null,
      isRoomSelectionAutoCleared: false,
    };
  }

  if (input.linkedRoomId != null) {
    return {
      selectedRoomId: isLinkedRoomSelectable ? input.linkedRoomId : null,
      isRoomSelectionAutoCleared: !isLinkedRoomSelectable,
    };
  }

  return {
    selectedRoomId: isSelectedRoomSelectable ? input.selectedRoomId : null,
    isRoomSelectionAutoCleared: false,
  };
}

export function shouldApplyAvailabilityResponse(input: {
  requestId: number;
  latestRequestId: number;
}) {
  return input.requestId === input.latestRequestId;
}

export function getRefreshAvailabilityWindow<T>(input: {
  latestWindow: T | null | undefined;
  fallbackWindow: T | null;
}) {
  return input.latestWindow !== undefined
    ? input.latestWindow
    : input.fallbackWindow;
}

export function getRoomIdForEditSave(input: {
  selectedRoomId: string | null;
  hasManualRoomSelectionChange: boolean;
  isRoomSelectionAutoCleared: boolean;
}) {
  if (input.hasManualRoomSelectionChange) {
    return input.selectedRoomId;
  }

  if (input.isRoomSelectionAutoCleared) {
    return null;
  }

  return undefined;
}

export function canCreateStandaloneRoomReservation(input: {
  title: string;
  reservationWindow: { startAt: string; endAt: string } | null;
}) {
  return input.title.trim().length > 0 && input.reservationWindow != null;
}
