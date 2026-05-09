import test from "node:test";
import assert from "node:assert/strict";
import type { EventCategory as DatabaseEventCategory } from "../src/types/database.types";
import type { Event } from "../src/types/models";
import {
  EVENT_CATEGORY_OPTIONS,
  getEventCategoryLabel,
  normalizeEventCategory,
} from "../src/utils/eventCategory";

type AssertTrue<T extends true> = T;
type IsExactly<Left, Right> = [Left] extends [Right]
  ? [Right] extends [Left]
    ? true
    : false
  : false;

const CANONICAL_EVENT_CATEGORIES = [
  "geral",
  "culto",
  "ensino",
  "jovens",
  "oração",
  "reunião",
  "especial",
] as const satisfies readonly DatabaseEventCategory[];

type EventModelCategoryMatchesDatabase = AssertTrue<
  IsExactly<Event["category"], DatabaseEventCategory>
>;
type EventCategoryOptionsMatchDatabase = AssertTrue<
  IsExactly<(typeof EVENT_CATEGORY_OPTIONS)[number]["value"], DatabaseEventCategory>
>;
void (0 as unknown as EventModelCategoryMatchesDatabase);
void (0 as unknown as EventCategoryOptionsMatchDatabase);

test("EVENT_CATEGORY_OPTIONS exposes canonical pt-BR categories", () => {
  assert.deepEqual(
    EVENT_CATEGORY_OPTIONS.map((option) => option.value),
    CANONICAL_EVENT_CATEGORIES,
  );
});

test("ebd stays non-canonical and normalizes to ensino", () => {
  assert.equal(
    EVENT_CATEGORY_OPTIONS.map((option) => String(option.value)).includes("ebd"),
    false,
  );
  assert.equal(normalizeEventCategory("ebd"), "ensino");
  assert.equal(getEventCategoryLabel("ebd"), "Ensino");
});

test("getEventCategoryLabel returns the Portuguese label directly", () => {
  assert.equal(getEventCategoryLabel("culto"), "Culto");
  assert.equal(getEventCategoryLabel("oração"), "Oração");
});

test("normalizeEventCategory falls back to geral for unknown values", () => {
  assert.equal(normalizeEventCategory("culto"), "culto");
  assert.equal(normalizeEventCategory(null), "geral");
  assert.equal(normalizeEventCategory("batismo"), "geral");
});
