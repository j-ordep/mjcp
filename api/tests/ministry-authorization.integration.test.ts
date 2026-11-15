import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { and, eq, inArray } from "drizzle-orm";
import Fastify from "fastify";
import { createDatabaseClient } from "../src/db/client.ts";
import { createMinistryAuthorizationRepository } from "../src/modules/ministries/repository.ts";
import { ministries, ministryMembers } from "../src/modules/ministries/schema.ts";
import { createMinistryAuthorizationService } from "../src/modules/ministries/service.ts";
import { createSchedulePlanRepository } from "../src/modules/schedules/repository.ts";
import { schedulesRoutes } from "../src/modules/schedules/routes.ts";
import { schedulePlans } from "../src/modules/schedules/schema.ts";
import { createSchedulePlanService } from "../src/modules/schedules/service.ts";
import { users } from "../src/modules/users/schema.ts";

test("autoriza gestão por papel e vínculo, bloqueia acessos e revalida permissões", { timeout: 15_000 }, async (t) => {
	const databaseUrl = process.env.DATABASE_URL;
	assert.ok(databaseUrl, "Configure DATABASE_URL para executar o teste de integração.");
	const { db, sqlClient } = createDatabaseClient(databaseUrl);
	t.after(() => sqlClient.end({ timeout: 1 }));

	const adminId = randomUUID();
	const leaderId = randomUUID();
	const memberId = randomUUID();
	const outsiderId = randomUUID();
	const ministryId = randomUUID();
	const otherMinistryId = randomUUID();
	const userIds = [adminId, leaderId, memberId, outsiderId];
	const ministryIds = [ministryId, otherMinistryId];
	const rollback = new Error("Desfazer os dados fictícios do teste.");

	try {
		await db.transaction(async (tx) => {
			await tx.insert(users).values([
				{ id: adminId, fullName: "Administrador fictício", accessRole: "admin" },
				{ id: leaderId, fullName: "Líder fictício" },
				{ id: memberId, fullName: "Integrante fictício" },
				{ id: outsiderId, fullName: "Pessoa fictícia sem vínculo" },
			]);
			await tx.insert(ministries).values([
				{ id: ministryId, name: `Ministério fictício ${ministryId}` },
				{ id: otherMinistryId, name: `Ministério fictício ${otherMinistryId}` },
			]);
			await tx.insert(ministryMembers).values([
				{ ministryId, userId: leaderId, isLeader: true },
				{ ministryId: otherMinistryId, userId: leaderId, isLeader: false },
				{ ministryId, userId: memberId, isLeader: false },
			]);

			const authorization = createMinistryAuthorizationService(createMinistryAuthorizationRepository(tx));
			const service = createSchedulePlanService(createSchedulePlanRepository(tx));
			let currentUserId: string | undefined;
			const app = Fastify();
			app.register(schedulesRoutes, {
				service,
				// Somente a identidade é controlada pelo teste. A permissão consulta o PostgreSQL.
				authorizeMinistry: (_request, selectedMinistryId) =>
					authorization.authorizeManagement({ userId: currentUserId, ministryId: selectedMinistryId }),
			});

			try {
				for (const input of [
					{ userId: leaderId, ministryId },
					{ userId: adminId, ministryId: otherMinistryId },
				]) {
					currentUserId = input.userId;
					const response = await app.inject({
						method: "POST",
						url: `/ministries/${input.ministryId}/schedule-plans`,
						payload: { month: "2026-10", occurrences: [] },
					});
					assert.equal(response.statusCode, 201, response.body);
				}

				for (const input of [
					{ name: "sem identidade", userId: undefined, ministryId, status: 401 },
					{ name: "integrante comum", userId: memberId, ministryId, status: 403 },
					{ name: "liderança em outro ministério", userId: leaderId, ministryId: otherMinistryId, status: 403 },
					{ name: "sem vínculo", userId: outsiderId, ministryId, status: 403 },
					{ name: "ministério inexistente", userId: adminId, ministryId: randomUUID(), status: 403 },
				]) {
					currentUserId = input.userId;
					const response = await app.inject({
						method: "POST",
						url: `/ministries/${input.ministryId}/schedule-plans`,
						payload: { month: "2026-11", occurrences: [] },
					});
					assert.equal(response.statusCode, input.status, input.name);
				}

				await tx
					.update(ministryMembers)
					.set({ isLeader: false })
					.where(and(eq(ministryMembers.userId, leaderId), eq(ministryMembers.ministryId, ministryId)));
				currentUserId = leaderId;
				const revokedLeader = await app.inject({
					method: "POST",
					url: `/ministries/${ministryId}/schedule-plans`,
					payload: { month: "2026-11", occurrences: [] },
				});
				assert.equal(revokedLeader.statusCode, 403);

				await tx.update(users).set({ accessRole: "member" }).where(eq(users.id, adminId));
				currentUserId = adminId;
				const revokedAdmin = await app.inject({
					method: "POST",
					url: `/ministries/${otherMinistryId}/schedule-plans`,
					payload: { month: "2026-11", occurrences: [] },
				});
				assert.equal(revokedAdmin.statusCode, 403);

				const stored = await tx.select().from(schedulePlans).where(inArray(schedulePlans.ministryId, ministryIds));
				assert.equal(stored.length, 2, "Pedidos negados não podem gravar planejamentos.");
			} finally {
				await app.close();
			}

			throw rollback;
		});
	} catch (error) {
		if (error !== rollback) throw error;
	}

	const remainingPlans = await db.select().from(schedulePlans).where(inArray(schedulePlans.ministryId, ministryIds));
	const remainingMembers = await db.select().from(ministryMembers).where(inArray(ministryMembers.userId, userIds));
	const remainingMinistries = await db.select().from(ministries).where(inArray(ministries.id, ministryIds));
	const remainingUsers = await db.select().from(users).where(inArray(users.id, userIds));
	assert.equal(remainingPlans.length, 0);
	assert.equal(remainingMembers.length, 0);
	assert.equal(remainingMinistries.length, 0);
	assert.equal(remainingUsers.length, 0);
});
