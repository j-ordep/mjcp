// Contrato para criar o rascunho mensal.
// POST /ministries/:ministryId/schedule-plans

import { z } from "zod";

// Valida a data de calendário completa usada na checagem do mês.
const dateSchema = z.iso.date();

// Valida o mês no corpo e na resposta. Acrescenta o dia 01 durante a checagem.
const monthSchema = z
	.string()
	.refine((value) => !value.startsWith("0000-") && dateSchema.safeParse(`${value}-01`).success, {
		error: "Informe um mês válido no formato YYYY-MM.",
	});

// O JavaScript compara instantes com precisão de milissegundos.
const scheduleTimestampSchema = z.iso.datetime({ offset: true }).refine((value) => !/\.\d{4}/.test(value), {
	error: "Informe no máximo três casas decimais nos segundos.",
});

// Valida cada item de assignments com a pessoa escalada e a função dela.
export const scheduleOccurrenceAssignmentInputSchema = z.strictObject({
	userId: z.uuid(),
	positionId: z.uuid(),
});

// Valida cada item de occurrences com horários, equipe e observações.
export const scheduleOccurrenceInputSchema = z
	.strictObject({
		startAt: scheduleTimestampSchema,
		endAt: scheduleTimestampSchema.optional(),
		notes: z.string().trim().optional(),
		assignments: z.array(scheduleOccurrenceAssignmentInputSchema),
	})
	.refine((data) => data.endAt === undefined || Date.parse(data.endAt) > Date.parse(data.startAt), {
		error: "O término deve ser posterior ao início.",
		path: ["endAt"],
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
export const createSchedulePlanBodySchema = z.strictObject({
	month: monthSchema,
	occurrences: z.array(scheduleOccurrenceInputSchema),
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
