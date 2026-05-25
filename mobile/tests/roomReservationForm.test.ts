import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_ROOM_RESERVATION_START_TIME,
  applyRoomReservationTimeMask,
  buildRoomReservationStatusLabel,
  buildRoomReservationWindow,
  getDefaultRoomReservationEndTime,
  normalizeRoomReservationTimeValue,
} from "../src/utils/roomReservationForm";

test("applyRoomReservationTimeMask keeps only four digits and inserts the separator", () => {
  assert.equal(applyRoomReservationTimeMask("1930"), "19:30");
  assert.equal(applyRoomReservationTimeMask("1a2b3c4d5"), "12:34");
  assert.equal(applyRoomReservationTimeMask("09"), "09");
});

test("normalizeRoomReservationTimeValue falls back safely for empty and partial values", () => {
  assert.equal(normalizeRoomReservationTimeValue("", "19:00"), "19:00");
  assert.equal(normalizeRoomReservationTimeValue("730", "19:00"), "07:30");
  assert.equal(normalizeRoomReservationTimeValue("2588", "19:00"), "23:59");
});

test("buildRoomReservationWindow returns an ISO window only for valid chronological times", () => {
  const validWindow = buildRoomReservationWindow("2026-05-25", "19:00", "21:30");

  assert.equal(validWindow?.startAt, "2026-05-25T22:00:00.000Z");
  assert.equal(validWindow?.endAt, "2026-05-26T00:30:00.000Z");
  assert.equal(buildRoomReservationWindow("2026-05-25", "21:30", "19:00"), null);
  assert.equal(buildRoomReservationWindow("2026-05-25", "xx", "19:00"), null);
});

test("getDefaultRoomReservationEndTime keeps the three-hour default from the selected start time", () => {
  assert.equal(DEFAULT_ROOM_RESERVATION_START_TIME, "19:00");
  assert.equal(getDefaultRoomReservationEndTime("2026-05-25", "19:00"), "22:00");
  assert.equal(getDefaultRoomReservationEndTime("2026-05-25", "09:30"), "12:30");
});

test("buildRoomReservationStatusLabel summarizes the day agenda in a compact way", () => {
  assert.equal(buildRoomReservationStatusLabel(0), "Livre no dia");
  assert.equal(buildRoomReservationStatusLabel(1), "1 reserva no dia");
  assert.equal(buildRoomReservationStatusLabel(3), "3 reservas no dia");
});
