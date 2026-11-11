import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { schedulePlans } from "./schema.ts";

// Dados de persistência preparados pelo service para criar um rascunho.
type InsertSchedulePlanInput = {
	ministryId: string;
	createdByUserId: string;
	referenceMonth: string;
	status: "draft";
};

// Recebe o cliente do Drizzle ou uma transação aberta pelo chamador.
export async function insertSchedulePlan(db: PostgresJsDatabase, input: InsertSchedulePlanInput) {
	const [plan] = await db.insert(schedulePlans).values(input).returning();

	if (!plan) {
		throw new Error("O banco não retornou o rascunho criado.");
	}

	return plan;
}
