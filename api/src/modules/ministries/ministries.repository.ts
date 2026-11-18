import { and, eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { users } from "../users/users.tables.ts";
import type { MinistryAuthorizationRepository } from "./ministries.service.ts";
import { ministries, ministryMembers } from "./ministries.tables.ts";

export function createMinistryAuthorizationRepository(db: PostgresJsDatabase): MinistryAuthorizationRepository {
	return {
		async findManagementAccess(userId, ministryId) {
			const [access] = await db
				.select({
					accessRole: users.accessRole,
					isLeader: ministryMembers.isLeader,
				})
				.from(ministries)
				.innerJoin(users, eq(users.id, userId))
				.leftJoin(
					ministryMembers,
					and(eq(ministryMembers.ministryId, ministries.id), eq(ministryMembers.userId, users.id)),
				)
				.where(eq(ministries.id, ministryId))
				.limit(1);

			return access;
		},
	};
}
