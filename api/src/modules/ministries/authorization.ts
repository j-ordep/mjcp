import type { FastifyRequest } from "fastify";
import type { MinistryAuthorizationService } from "./service.ts";

// A identidade é preenchida no servidor pelo futuro hook de autenticação.
type MinistryAuthorizationRequest = FastifyRequest & {
	authenticatedUser?: { id: string } | null;
};

// Cria a função que adapta a requisição HTTP para o service de autorização.
export function createMinistryManagementAuthorizer(ministryAuthorizationService: MinistryAuthorizationService) {
	return async function authorizeMinistryManagement(
		request: MinistryAuthorizationRequest,
		ministryId: string,
	): Promise<string> {
		return ministryAuthorizationService.authorizeUserToManageMinistry({
			userId: request.authenticatedUser?.id,
			ministryId,
		});
	};
}
