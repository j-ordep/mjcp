import { z } from "zod";

export const createSchedulePlanParamsSchema = z.strictObject({
	ministryId: z.uuid(),
});

export const createSchedulePlanBodySchema = z.strictObject({
	month: z.string().regex(/^(?!0000)\d{4}-(0[1-9]|1[0-2])$/, "Informe um mês válido no formato YYYY-MM."),
});

export type CreateSchedulePlanParams = z.infer<typeof createSchedulePlanParamsSchema>;

export type CreateSchedulePlanBody = z.infer<typeof createSchedulePlanBodySchema>;
