import { DrizzleQueryError } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import postgres from "postgres";
import {
	createSchedulePlanBodySchema,
	createSchedulePlanErrorResponseSchema,
	createSchedulePlanParamsSchema,
	createSchedulePlanResponseSchema,
} from "./dto.ts";
import { createSchedulePlan, ScheduleOccurrencesNotSupportedError } from "./service.ts";

type SchedulesRoutesOptions = {
	db: PostgresJsDatabase;
	// Autentica, verifica a gestão do ministério e devolve o ID do autor.
	authorizeMinistry: (request: FastifyRequest, ministryId: string) => Promise<string>;
};

// O plugin recebe suas dependências quando for registrado com app.register().
export const schedulesRoutes: FastifyPluginAsync<SchedulesRoutesOptions> = async (app, options) => {
	app.setValidatorCompiler(validatorCompiler);
	app.setSerializerCompiler(serializerCompiler);

	app.withTypeProvider<ZodTypeProvider>().post(
		"/ministries/:ministryId/schedule-plans",
		{
			schema: {
				params: createSchedulePlanParamsSchema,
				body: createSchedulePlanBodySchema,
				response: {
					201: createSchedulePlanResponseSchema,
					400: createSchedulePlanErrorResponseSchema,
					401: createSchedulePlanErrorResponseSchema,
					403: createSchedulePlanErrorResponseSchema,
					409: createSchedulePlanErrorResponseSchema,
					500: createSchedulePlanErrorResponseSchema,
				},
			},
		},
		async (request, reply) => {
			const { ministryId } = request.params;
			try {
				const createdByUserId = await options.authorizeMinistry(request, ministryId);
				const plan = await createSchedulePlan(options.db, {
					ministryId,
					createdByUserId,
					month: request.body.month,
					occurrences: request.body.occurrences,
				});

				return reply.code(201).send({
					id: plan.id,
					ministryId: plan.ministryId,
					month: plan.referenceMonth.slice(0, 7),
					status: "draft",
				});
			} catch (error) {
				if (error instanceof Error && "statusCode" in error && (error.statusCode === 401 || error.statusCode === 403)) {
					const statusCode = error.statusCode;
					return reply.code(statusCode).send({
						statusCode,
						error: statusCode === 401 ? "Unauthorized" : "Forbidden",
						message: statusCode === 401 ? "Autenticação necessária." : "Você não pode gerenciar este ministério.",
					});
				}

				if (error instanceof ScheduleOccurrencesNotSupportedError) {
					return reply.code(400).send({
						statusCode: 400,
						error: "Bad Request",
						message: error.message,
					});
				}

				const cause = error instanceof DrizzleQueryError ? error.cause : error;
				if (
					cause instanceof postgres.PostgresError &&
					cause.code === "23505" &&
					cause.constraint_name === "schedule_plans_ministry_month_unique"
				) {
					return reply.code(409).send({
						statusCode: 409,
						error: "Conflict",
						message: "Já existe uma escala para este ministério neste mês.",
					});
				}

				request.log.error("Falha ao criar o rascunho mensal.");
				return reply.code(500).send({
					statusCode: 500,
					error: "Internal Server Error",
					message: "Não foi possível criar a escala.",
				});
			}
		},
	);
};
