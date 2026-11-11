import type { ScheduleOccurrenceInput } from "./dto.ts";

// Registro devolvido pela operação, sem depender dos tipos do Drizzle.
export type SchedulePlan = {
	id: string;
	ministryId: string;
	createdByUserId: string;
	referenceMonth: string;
	status: "draft" | "published";
	publishedAt: Date | null;
	createdAt: Date;
};

// Dados validados pelo handler, acrescidos do ministério e do autor.
type CreateSchedulePlanInput = {
	ministryId: string;
	createdByUserId: string;
	month: string;
	occurrences: ScheduleOccurrenceInput[];
};

// Dados que o service prepara para a persistência.
export type InsertSchedulePlanInput = {
	ministryId: string;
	createdByUserId: string;
	referenceMonth: string;
	status: "draft";
};

// O service depende desta capacidade de gravação.
export type SchedulePlanRepository = {
	insertSchedulePlan: (input: InsertSchedulePlanInput) => Promise<SchedulePlan>;
};

// O handler depende desta operação, independentemente de sua implementação.
export type SchedulePlanService = {
	createSchedulePlan: (input: CreateSchedulePlanInput) => Promise<SchedulePlan>;
};

export class ScheduleOccurrencesNotSupportedError extends Error {}
export class SchedulePlanAlreadyExistsError extends Error {}

// A factory guarda a dependência para usá-la em cada chamada da operação.
export function createSchedulePlanService(repository: SchedulePlanRepository): SchedulePlanService {
	return {
		async createSchedulePlan(input) {
			if (input.occurrences.length > 0) {
				throw new ScheduleOccurrencesNotSupportedError("A criação de ocorrências ainda não está disponível.");
			}

			return repository.insertSchedulePlan({
				ministryId: input.ministryId,
				createdByUserId: input.createdByUserId,
				referenceMonth: `${input.month}-01`,
				status: "draft",
			});
		},
	};
}
