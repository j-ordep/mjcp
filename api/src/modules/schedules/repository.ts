import { DrizzleQueryError } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { schedulePlans } from "./schema.ts";
import { SchedulePlanAlreadyExistsError, type SchedulePlanRepository } from "./service.ts";

// O cliente ou a transação ficam guardados no repository.
export function createSchedulePlanRepository(db: PostgresJsDatabase): SchedulePlanRepository {
	return {
		async insertSchedulePlan(input) {
			try {
				const [plan] = await db.insert(schedulePlans).values(input).returning();

				if (!plan) {
					throw new Error("O banco não retornou o rascunho criado.");
				}

				return plan;
			} catch (error) {
				const cause = error instanceof DrizzleQueryError ? error.cause : error;
				if (
					cause instanceof postgres.PostgresError &&
					cause.code === "23505" &&
					cause.constraint_name === "schedule_plans_ministry_month_unique"
				) {
					throw new SchedulePlanAlreadyExistsError("Já existe uma escala para este ministério neste mês.");
				}

				throw error;
			}
		},
	};
}
