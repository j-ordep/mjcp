import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { eq } from "drizzle-orm";
import Fastify from "fastify";
import { checkDatabaseConnection, createDatabaseClient } from "../src/db/client.ts";
import { createMinistryAuthorizationRepository } from "../src/modules/ministries/repository.ts";
import { ministries, ministryMembers } from "../src/modules/ministries/schema.ts";
import { createMinistryAuthorizationService } from "../src/modules/ministries/service.ts";
import type { CreateSchedulePlanResponse } from "../src/modules/schedules/dto.ts";
import { createSchedulePlanRepository } from "../src/modules/schedules/repository.ts";
import { schedulesRoutes } from "../src/modules/schedules/routes.ts";
import { schedulePlans } from "../src/modules/schedules/schema.ts";
import { createSchedulePlanService } from "../src/modules/schedules/service.ts";
import { users } from "../src/modules/users/schema.ts";

test("cria rascunho, rejeita duplicata e desfaz os dados no PostgreSQL", { timeout: 15_000 }, async (t) => {
	const databaseUrl = process.env.DATABASE_URL;
	assert.ok(databaseUrl, "Configure DATABASE_URL para executar o teste de integração.");

	const { db, sqlClient } = createDatabaseClient(databaseUrl);
	t.after(() => sqlClient.end({ timeout: 1 }));

	const [connection] = await checkDatabaseConnection(db);
	assert.equal(connection?.connected, 1);

	const authorId = randomUUID();
	const ministryId = randomUUID();
	const rollback = new Error("Desfazer os dados fictícios do teste.");
	let createdPlanId: string | undefined;

	try {
		await db.transaction(async (tx) => {
			// Todos os dados fictícios pertencem à mesma transação.
			await tx.insert(users).values({ id: authorId, fullName: "Pessoa fictícia de teste" });
			await tx.insert(ministries).values({ id: ministryId, name: `Ministério fictício ${ministryId}` });
			await tx.insert(ministryMembers).values({ ministryId, userId: authorId, isLeader: true });

			const app = Fastify();
			const repository = createSchedulePlanRepository(tx);
			const service = createSchedulePlanService(repository);
			const authorization = createMinistryAuthorizationService(createMinistryAuthorizationRepository(tx));

			app.register(schedulesRoutes, {
				service,
				// A identidade é controlada apenas neste teste.
				authorizeMinistryManagement: (_request, selectedMinistryId) =>
					authorization.authorizeUserToManageMinistry({ userId: authorId, ministryId: selectedMinistryId }),
			});

			try {
				const request = {
					method: "POST" as const,
					url: `/ministries/${ministryId}/schedule-plans`,
					payload: { month: "2026-10", occurrences: [] },
				};

				const created = await app.inject(request);
				assert.equal(created.statusCode, 201, created.body);

				const body = created.json<CreateSchedulePlanResponse>();
				createdPlanId = body.id;
				assert.deepEqual(body, {
					id: createdPlanId,
					ministryId,
					month: "2026-10",
					status: "draft",
				});

				// Confere o registro real dentro da transação.
				const [stored] = await tx.select().from(schedulePlans).where(eq(schedulePlans.id, createdPlanId));
				assert.ok(stored);
				assert.equal(stored.createdByUserId, authorId);
				assert.equal(stored.ministryId, ministryId);
				assert.equal(stored.referenceMonth, "2026-10-01");
				assert.equal(stored.status, "draft");
				assert.equal(stored.publishedAt, null);
				assert.ok(stored.createdAt instanceof Date);

				const duplicate = await app.inject(request);
				assert.equal(duplicate.statusCode, 409, duplicate.body);
				assert.equal(duplicate.json().message, "Já existe uma escala para este ministério neste mês.");
			} finally {
				await app.close();
			}

			// A exceção provoca ROLLBACK até quando as verificações passam.
			throw rollback;
		});
	} catch (error) {
		if (error !== rollback) throw error;
	}

	assert.ok(createdPlanId);

	const remainingPlans = await db
		.select({ id: schedulePlans.id })
		.from(schedulePlans)
		.where(eq(schedulePlans.id, createdPlanId));
	const remainingMembers = await db
		.select({ id: ministryMembers.id })
		.from(ministryMembers)
		.where(eq(ministryMembers.userId, authorId));
	const remainingMinistries = await db
		.select({ id: ministries.id })
		.from(ministries)
		.where(eq(ministries.id, ministryId));
	const remainingUsers = await db.select({ id: users.id }).from(users).where(eq(users.id, authorId));

	assert.equal(remainingPlans.length, 0);
	assert.equal(remainingMembers.length, 0);
	assert.equal(remainingMinistries.length, 0);
	assert.equal(remainingUsers.length, 0);
});
