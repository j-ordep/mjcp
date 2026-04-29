import test from "node:test";
import assert from "node:assert/strict";
import {
  EVENT_CATEGORY_OPTIONS,
  getEventCategoryLabel,
  normalizeEventCategory,
} from "../src/utils/eventCategory";

test("EVENT_CATEGORY_OPTIONS exposes Portuguese event categories", () => {
  assert.deepEqual(
    EVENT_CATEGORY_OPTIONS.map((option) => option.value),
    ["geral", "culto", "ensino", "jovens", "oração", "reunião", "especial"],
  );
});

test("getEventCategoryLabel returns the Portuguese label directly", () => {
  assert.equal(getEventCategoryLabel("culto"), "Culto");
  assert.equal(getEventCategoryLabel("ensino"), "Ensino");
  assert.equal(getEventCategoryLabel("oração"), "Oração");
});

test("normalizeEventCategory falls back to geral for unknown values", () => {
  assert.equal(normalizeEventCategory("culto"), "culto");
  assert.equal(normalizeEventCategory(null), "geral");
  assert.equal(normalizeEventCategory("batismo"), "geral");
});
