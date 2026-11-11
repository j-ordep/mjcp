import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { ScheduleOccurrenceInput } from "./dto.ts";
import { insertSchedulePlan } from "./repository.ts";

// O handler fornece os dados validados, o ministério e o autor autenticado.
type CreateSchedulePlanInput = {
	ministryId: string;
	createdByUserId: string;
	month: string;
	occurrences: ScheduleOccurrenceInput[];
};

// Permite ao handler identificar esta falha e escolher a resposta HTTP.
export class ScheduleOccurrencesNotSupportedError extends Error {}

export async function createSchedulePlan(db: PostgresJsDatabase, input: CreateSchedulePlanInput) {
	// Esta primeira entrega cria o rascunho vazio. As ocorrências serão gravadas depois.
	if (input.occurrences.length > 0) {
		throw new ScheduleOccurrencesNotSupportedError("A criação de ocorrências ainda não está disponível.");
	}

	// Prepara os dados da operação antes de enviá-los ao repository.
	return insertSchedulePlan(db, {
		ministryId: input.ministryId,
		createdByUserId: input.createdByUserId,
		referenceMonth: `${input.month}-01`,
		status: "draft",
	});
}
