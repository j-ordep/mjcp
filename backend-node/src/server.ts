import Fastify from "fastify";
import { validatorCompiler } from "fastify-type-provider-zod";
import { eventRoutes } from "./modules/events/route.ts";

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);

app.register(eventRoutes);

await app.listen({ port: 3000 });
