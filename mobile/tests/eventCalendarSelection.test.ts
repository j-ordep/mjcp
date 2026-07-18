import test from "node:test";
import assert from "node:assert/strict";
import {
  collapseCalendarSelectionToSingleDate,
  createCalendarSelectionMark,
  toggleCalendarDateSelection,
} from "../src/utils/eventCalendarSelection";

test("toggleCalendarDateSelection keeps a single selected date by default", () => {
  const result = toggleCalendarDateSelection({
    selectedDays: {
      "2026-05-23": createCalendarSelectionMark(),
    },
    dateString: "2026-05-25",
    allowMultipleDates: false,
  });

  assert.deepEqual(result, {
    "2026-05-25": createCalendarSelectionMark(),
  });
});

test("toggleCalendarDateSelection adds and removes dates when multiple selection is enabled", () => {
  const addedResult = toggleCalendarDateSelection({
    selectedDays: {
      "2026-05-23": createCalendarSelectionMark(),
    },
    dateString: "2026-05-25",
    allowMultipleDates: true,
  });

  assert.deepEqual(addedResult, {
    "2026-05-23": createCalendarSelectionMark(),
    "2026-05-25": createCalendarSelectionMark(),
  });

  const removedResult = toggleCalendarDateSelection({
    selectedDays: addedResult,
    dateString: "2026-05-23",
    allowMultipleDates: true,
  });

  assert.deepEqual(removedResult, {
    "2026-05-25": createCalendarSelectionMark(),
  });
});

test("toggleCalendarDateSelection still behaves as single selection during edit", () => {
  const result = toggleCalendarDateSelection({
    selectedDays: {
      "2026-05-23": createCalendarSelectionMark(),
    },
    dateString: "2026-05-25",
    allowMultipleDates: true,
    isEdit: true,
  });

  assert.deepEqual(result, {
    "2026-05-25": createCalendarSelectionMark(),
  });
});

test("collapseCalendarSelectionToSingleDate keeps the earliest selected date", () => {
  const result = collapseCalendarSelectionToSingleDate({
    "2026-05-30": createCalendarSelectionMark(),
    "2026-05-25": createCalendarSelectionMark(),
    "2026-05-27": createCalendarSelectionMark(),
  });

  assert.deepEqual(result, {
    "2026-05-25": createCalendarSelectionMark(),
  });
});
