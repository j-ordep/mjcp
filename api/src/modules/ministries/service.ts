// O repository devolve o papel global e o vínculo no ministério solicitado.
export type MinistryManagementAccess = {
	accessRole: "admin" | "member";
	isLeader: boolean | null;
};

export type MinistryAuthorizationRepository = {
	findManagementAccess: (userId: string, ministryId: string) => Promise<MinistryManagementAccess | undefined>;
};

export type MinistryAuthorizationService = {
	authorizeUserToManageMinistry: (input: { userId: string | undefined; ministryId: string }) => Promise<string>;
};

export class AuthenticationRequiredError extends Error {}
export class MinistryManagementDeniedError extends Error {}

// Recebe a identidade já validada pela autenticação e decide a permissão.
export function createMinistryAuthorizationService(
	repository: MinistryAuthorizationRepository,
): MinistryAuthorizationService {
	return {
		async authorizeUserToManageMinistry({ userId, ministryId }) {
			if (!userId) {
				throw new AuthenticationRequiredError("Autenticação necessária.");
			}

			const access = await repository.findManagementAccess(userId, ministryId);
			if (!access || (access.accessRole !== "admin" && access.isLeader !== true)) {
				throw new MinistryManagementDeniedError("Você não pode gerenciar este ministério.");
			}

			return userId;
		},
	};
}
