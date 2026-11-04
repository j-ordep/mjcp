import "dotenv/config";
import Fastify from "fastify";
import { validatorCompiler } from "fastify-type-provider-zod";
import { checkDatabaseConnection, createDatabaseClient } from "./db/client.ts";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL não configurada.");
}

const { sqlClient, db } = createDatabaseClient(databaseUrl);

const app = Fastify({ logger: true });

app.setValidatorCompiler(validatorCompiler);

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
