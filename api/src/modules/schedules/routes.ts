import type { FastifyPluginAsync } from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { createSchedulePlanController, type SchedulePlanControllerDependencies } from "./controller.ts";
import {
	createSchedulePlanBodySchema,
	createSchedulePlanErrorResponseSchema,
	createSchedulePlanParamsSchema,
	createSchedulePlanResponseSchema,
} from "./dto.ts";

// O plugin recebe suas dependências quando for registrado com app.register().
export const schedulesRoutes: FastifyPluginAsync<SchedulePlanControllerDependencies> = async (app, options) => {
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
		createSchedulePlanController(options),
	);
};
