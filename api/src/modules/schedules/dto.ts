import { z } from "zod";

const dateSchema = z.iso.date();

const monthSchema = z
	.string()
	.refine((value) => !value.startsWith("0000-") && dateSchema.safeParse(`${value}-01`).success, {
		error: "Informe um mês válido no formato YYYY-MM.",
	});

export const scheduleOccurrenceAssignmentInputSchema = z.strictObject({
	userId: z.uuid(),
	positionId: z.uuid(),
});

// Dados de uma ocorrência do planejamento mensal.
export const scheduleOccurrenceInputSchema = z
	.strictObject({
		title: z.string().trim().min(1, "O título não pode ficar vazio.").optional(),
		startAt: z.iso.datetime({ offset: true }),
		endAt: z.iso.datetime({ offset: true }).optional(),
		notes: z.string().trim().optional(),
		assignments: z.array(scheduleOccurrenceAssignmentInputSchema),
	})
	.refine((data) => data.endAt === undefined || Date.parse(data.endAt) > Date.parse(data.startAt), {
		error: "O término deve ser posterior ao início.",
		path: ["endAt"],
	});

// URL da criação mensal: identifica o ministério.
export const createSchedulePlanParamsSchema = z.strictObject({
	ministryId: z.uuid(),
});

export const createSchedulePlanBodySchema = z.strictObject({
	month: monthSchema,
	occurrences: z.array(scheduleOccurrenceInputSchema),
});

// Resposta mínima após criar o rascunho mensal.
export const createSchedulePlanResponseSchema = z.strictObject({
	id: z.uuid(),
	ministryId: z.uuid(),
	month: monthSchema,
	status: z.literal("draft"),
});

export type ScheduleOccurrenceAssignmentInput = z.infer<typeof scheduleOccurrenceAssignmentInputSchema>;
export type ScheduleOccurrenceInput = z.infer<typeof scheduleOccurrenceInputSchema>;
export type CreateSchedulePlanParams = z.infer<typeof createSchedulePlanParamsSchema>;
export type CreateSchedulePlanBody = z.infer<typeof createSchedulePlanBodySchema>;
export type CreateSchedulePlanResponse = z.infer<typeof createSchedulePlanResponseSchema>;
