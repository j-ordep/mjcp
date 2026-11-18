// Contrato para criar o rascunho mensal.
// POST /ministries/:ministryId/schedule-plans

import { z } from "zod";

// Valida a data de calendário completa usada na checagem do mês.
const dateSchema = z.iso.date().refine((value) => !value.startsWith("0000-"), {
	error: "Informe uma data válida no formato YYYY-MM-DD.",
});

// Valida o mês no corpo e na resposta. Acrescenta o dia 01 durante a checagem.
const monthSchema = z
	.string()
	.refine((value) => !value.startsWith("0000-") && dateSchema.safeParse(`${value}-01`).success, {
		error: "Informe um mês válido no formato YYYY-MM.",
	});

// Horário local opcional, apenas para orientar os integrantes; não ocupa um intervalo.
const informationalTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, {
	error: "Informe o horário no formato HH:mm.",
});

// Valida cada item de assignments com a pessoa escalada e a função dela.
export const scheduleOccurrenceAssignmentInputSchema = z.strictObject({
	userId: z.uuid(),
	positionId: z.uuid(),
});

// Valida cada item de occurrences pela data civil, equipe e observações.
export const scheduleOccurrenceInputSchema = z
	.strictObject({
		date: dateSchema,
		time: informationalTimeSchema.optional(),
		notes: z.string().trim().optional(),
		assignments: z.array(scheduleOccurrenceAssignmentInputSchema),
	})
	.refine(
		({ assignments }) => {
			const userIds = assignments.map(({ userId }) => userId.toLowerCase());
			return new Set(userIds).size === userIds.length;
		},
		{
			error: "Cada pessoa pode ser escalada apenas uma vez na ocorrência.",
			path: ["assignments"],
		},
	);

// Valida ministryId na URL para identificar o ministério escolhido pelo líder.
export const createSchedulePlanParamsSchema = z.strictObject({
	ministryId: z.uuid(),
});

// Valida o corpo da requisição com o mês e a lista de ocorrências.
export const createSchedulePlanBodySchema = z
	.strictObject({
		month: monthSchema,
		occurrences: z.array(scheduleOccurrenceInputSchema),
	})
	.refine(({ month, occurrences }) => occurrences.every((occurrence) => occurrence.date.startsWith(`${month}-`)), {
		error: "Cada ocorrência deve pertencer ao mês do planejamento.",
		path: ["occurrences"],
	})
	.refine(({ occurrences }) => new Set(occurrences.map(({ date }) => date)).size === occurrences.length, {
		error: "O ministério pode ter apenas uma ocorrência por dia.",
		path: ["occurrences"],
	});

// Valida a resposta da criação com o ID do planejamento, ministério, mês e estado de rascunho.
export const createSchedulePlanResponseSchema = z.strictObject({
	id: z.uuid(),
	ministryId: z.uuid(),
	month: monthSchema,
	status: z.literal("draft"),
});

// Formato dos erros HTTP da criação, incluindo os erros de validação do Fastify.
export const createSchedulePlanErrorResponseSchema = z.object({
	statusCode: z.number().int(),
	error: z.string(),
	message: z.string(),
});

// Tipos TypeScript derivados dos schemas para receber a entrada e montar a resposta.
export type ScheduleOccurrenceAssignmentInput = z.infer<typeof scheduleOccurrenceAssignmentInputSchema>;
export type ScheduleOccurrenceInput = z.infer<typeof scheduleOccurrenceInputSchema>;
export type CreateSchedulePlanParams = z.infer<typeof createSchedulePlanParamsSchema>;
export type CreateSchedulePlanBody = z.infer<typeof createSchedulePlanBodySchema>;
export type CreateSchedulePlanResponse = z.infer<typeof createSchedulePlanResponseSchema>;
export type CreateSchedulePlanErrorResponse = z.infer<typeof createSchedulePlanErrorResponseSchema>;
