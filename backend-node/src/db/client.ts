import { sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export function createDatabaseClient(databaseUrl: string) {
	const sqlClient = postgres(databaseUrl);
	const db = drizzle(sqlClient);

	return { sqlClient, db };
}

export async function checkDatabaseConnection(db: PostgresJsDatabase) {
	const result = await db.execute<{ connected: number }>(
		sql`SELECT 1 AS connected`,
	);

	return result;
}
