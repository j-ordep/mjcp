import assert from "node:assert/strict";
import { test } from "node:test";
import { createSchedulePlanBodySchema, scheduleOccurrenceInputSchema } from "../src/modules/schedules/schedules.schema.ts";

const occurrence = { date: "2028-02-29", assignments: [] };

test("ocorrência usa uma data civil e horário opcional apenas informativo", () => {
	assert.deepEqual(scheduleOccurrenceInputSchema.parse(occurrence), occurrence);
	assert.equal(scheduleOccurrenceInputSchema.parse({ ...occurrence, time: "19:30" }).time, "19:30");
	for (const date of ["2026-02-29", "2026-11-31", "0000-01-01", "2026-11-15T00:00:00Z"]) {
		assert.equal(scheduleOccurrenceInputSchema.safeParse({ ...occurrence, date }).success, false, date);
	}
	for (const time of ["24:00", "19:60", "9:00", "19:00:00", "19:00Z", ""]) {
		assert.equal(scheduleOccurrenceInputSchema.safeParse({ ...occurrence, time }).success, false, time);
	}
	for (const field of ["startAt", "endAt", "eventId"]) {
		assert.equal(
			scheduleOccurrenceInputSchema.safeParse({ ...occurrence, [field]: "2028-02-29T19:00:00Z" }).success,
			false,
		);
	}
});

test("o plano aceita somente ocorrências do próprio mês e uma por dia", () => {
	assert.equal(createSchedulePlanBodySchema.safeParse({ month: "2028-02", occurrences: [occurrence] }).success, true);
	assert.equal(createSchedulePlanBodySchema.safeParse({ month: "2028-03", occurrences: [occurrence] }).success, false);
	assert.equal(
		createSchedulePlanBodySchema.safeParse({
			month: "2028-02",
			occurrences: [occurrence, { ...occurrence, time: "20:00" }],
		}).success,
		false,
	);
	assert.equal(createSchedulePlanBodySchema.safeParse({ month: "2028-02", occurrences: [] }).success, true);
});
