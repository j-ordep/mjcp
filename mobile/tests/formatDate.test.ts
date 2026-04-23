import test from "node:test";
import assert from "node:assert/strict";
import { formatDateShort, formatDateTime, formatTime } from "../src/utils/formatDate";

test("formatDateTime returns the weekday, date and time in the expected UI format", () => {
  const result = formatDateTime("2026-04-09T10:05:00-03:00");

  assert.equal(result, "Qui, 09/04/2026 • 10:05");
});

test("formatDateShort returns a compact localized date string", () => {
  const result = formatDateShort("2026-04-09T10:05:00-03:00");

  assert.equal(result, "Qui, 09 de abr.");
});

test("formatTime returns only the local hour and minute", () => {
  const result = formatTime("2026-04-09T10:05:00-03:00");

  assert.equal(result, "10:05");
});

test("formatDate helpers return an empty string for missing input", () => {
  assert.equal(formatDateTime(""), "");
  assert.equal(formatDateShort(""), "");
  assert.equal(formatTime(""), "");
});
