import type { FastifyReply, FastifyRequest } from "fastify";
import type {
	CreateSchedulePlanBody,
	CreateSchedulePlanErrorResponse,
	CreateSchedulePlanParams,
	CreateSchedulePlanResponse,
} from "./dto.ts";
import {
	ScheduleOccurrencesNotSupportedError,
	SchedulePlanAlreadyExistsError,
	type SchedulePlanService,
} from "./service.ts";

export type SchedulePlanControllerDependencies = {
	service: SchedulePlanService;
	// Autentica, verifica a gestão do ministério e devolve o ID do autor.
	authorizeMinistry: (request: FastifyRequest, ministryId: string) => Promise<string>;
};

// Ao extrair o handler, seus tipos de entrada e resposta ficam explícitos.
type CreateSchedulePlanRoute = {
	Params: CreateSchedulePlanParams;
	Body: CreateSchedulePlanBody;
	Reply: {
		201: CreateSchedulePlanResponse;
		400: CreateSchedulePlanErrorResponse;
		401: CreateSchedulePlanErrorResponse;
		403: CreateSchedulePlanErrorResponse;
		409: CreateSchedulePlanErrorResponse;
		500: CreateSchedulePlanErrorResponse;
	};
};

// Guarda o service e a autorização para usá-los em cada requisição.
export function createSchedulePlanController(options: SchedulePlanControllerDependencies) {
	return async function createSchedulePlanHandler(
		request: FastifyRequest<CreateSchedulePlanRoute>,
		reply: FastifyReply<CreateSchedulePlanRoute>,
	) {
		const { ministryId } = request.params;
		try {
			const createdByUserId = await options.authorizeMinistry(request, ministryId);
			const plan = await options.service.createSchedulePlan({
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

			if (error instanceof SchedulePlanAlreadyExistsError) {
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
	};
}
