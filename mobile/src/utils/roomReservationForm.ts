import { getDefaultEndAt } from "./eventDate";

export const DEFAULT_ROOM_RESERVATION_START_TIME = "19:00";

export function buildRoomReservationStatusLabel(reservationCount: number) {
  if (reservationCount <= 0) {
    return "Livre no dia";
  }

  return `${reservationCount} ${reservationCount === 1 ? "reserva" : "reservas"} no dia`;
}

export function applyRoomReservationTimeMask(value: string) {
  let clean = value.replace(/\D/g, "");

  if (clean.length > 4) {
    clean = clean.slice(0, 4);
  }

  if (clean.length <= 2) {
    return clean;
  }

  return `${clean.slice(0, 2)}:${clean.slice(2)}`;
}

export function normalizeRoomReservationTimeValue(value: string, fallback: string) {
  if (!value.trim()) {
    return fallback;
  }

  const clean = value.replace(/\D/g, "");

  if (!clean) {
    return fallback;
  }

  let hours = fallback.slice(0, 2);
  let minutes = fallback.slice(3, 5);

  if (clean.length <= 2) {
    hours = clean.padStart(2, "0");
  } else if (clean.length === 3) {
    hours = clean.slice(0, 1).padStart(2, "0");
    minutes = clean.slice(1).padStart(2, "0");
  } else {
    hours = clean.slice(0, 2);
    minutes = clean.slice(2, 4);
  }

  const hoursNumber = Number.parseInt(hours, 10);
  const minutesNumber = Number.parseInt(minutes, 10);

  return `${String(Math.min(Number.isNaN(hoursNumber) ? 0 : hoursNumber, 23)).padStart(2, "0")}:${String(
    Math.min(Number.isNaN(minutesNumber) ? 0 : minutesNumber, 59),
  ).padStart(2, "0")}`;
}

export function isValidRoomReservationTimeValue(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    return false;
  }

  const hours = Number.parseInt(match[1], 10);
  const minutes = Number.parseInt(match[2], 10);

  return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59;
}

export function buildRoomReservationWindow(
  dateKey: string,
  startTime: string,
  endTime: string,
) {
  if (
    !isValidRoomReservationTimeValue(startTime) ||
    !isValidRoomReservationTimeValue(endTime)
  ) {
    return null;
  }

  const startDate = new Date(`${dateKey}T${startTime}:00`);
  const endDate = new Date(`${dateKey}T${endTime}:00`);

  if (
    Number.isNaN(startDate.getTime()) ||
    Number.isNaN(endDate.getTime()) ||
    endDate.getTime() <= startDate.getTime()
  ) {
    return null;
  }

  return {
    startAt: startDate.toISOString(),
    endAt: endDate.toISOString(),
  };
}

export function getDefaultRoomReservationEndTime(
  dateKey: string,
  startTime = DEFAULT_ROOM_RESERVATION_START_TIME,
) {
  return new Date(
    getDefaultEndAt(new Date(`${dateKey}T${startTime}:00`)),
  )
    .toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
    .slice(0, 5);
}
