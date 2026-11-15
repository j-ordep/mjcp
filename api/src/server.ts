import "dotenv/config";
import Fastify from "fastify";
import { validatorCompiler } from "fastify-type-provider-zod";
import { checkDatabaseConnection, createDatabaseClient } from "./db/client.ts";
import { createMinistryManagementAuthorizer } from "./modules/ministries/authorization.ts";
import { createMinistryAuthorizationRepository } from "./modules/ministries/repository.ts";
import { createMinistryAuthorizationService } from "./modules/ministries/service.ts";
import { createSchedulePlanRepository } from "./modules/schedules/repository.ts";
import { schedulesRoutes } from "./modules/schedules/routes.ts";
import { createSchedulePlanService } from "./modules/schedules/service.ts";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL não configurada.");
}

const { sqlClient, db } = createDatabaseClient(databaseUrl);

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);

// O banco fica nos repositories; os services recebem apenas as operações de que precisam.
const ministryAuthorizationRepository = createMinistryAuthorizationRepository(db);
const ministryAuthorizationService = createMinistryAuthorizationService(ministryAuthorizationRepository);
const schedulePlanRepository = createSchedulePlanRepository(db);
const schedulePlanService = createSchedulePlanService(schedulePlanRepository);

// O plugin recebe as dependências que serão usadas pelo controller.
app.register(schedulesRoutes, {
	service: schedulePlanService,
	authorizeMinistryManagement: createMinistryManagementAuthorizer(ministryAuthorizationService),
});

app.addHook("onClose", async () => {
	await sqlClient.end();
	app.log.info("Conexão com PostgreSQL encerrada.");
});

async function shutdown() {
	try {
		await app.close();
		process.exit(0);
	} catch (error) {
		app.log.error(error, "Falha ao encerrar a API.");
		process.exit(1);
	}
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);

try {
	await checkDatabaseConnection(db);
	app.log.info("Conexão com PostgreSQL validada.");

	await app.listen({ port: 3000 });
} catch (error) {
	app.log.error(error, "Falha ao iniciar a API.");

	try {
		await app.close();
	} catch (closeError) {
		app.log.error(closeError, "Falha ao liberar os recursos.");
	} finally {
		process.exit(1);
	}
}
