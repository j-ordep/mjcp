import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";

const createEventSchema = z.object({
  title: z.string().trim().min(1),
});

export async function eventRoutes(app: FastifyInstance) {
  const events = [
    { id: "1", title: "Culto de domingo" },
    { id: "2", title: "Ensaio do louvor" },
  ];

  app.get("/events", async () => {
    return events;
  });

  app.get<{ Params: { id: string } }>("/events/:id", async (request, reply) => {
    const { id } = request.params;

    const event = events.find((event) => event.id === id);

    if (!event) {
      return reply.code(404).send({
        message: "Evento não encontrado",
      });
    }

    return event;
  });

  app.post("/events", async (request, reply) => {
    const result = createEventSchema.safeParse(request.body);

    if (!result.success) {
      return reply.code(400).send({
        message: "Informe um título válido para o evento",
      });
    }

    const event = {
      id: randomUUID(),
      title: result.data.title,
    };

    events.push(event);

    return reply.code(201).send(event);
  });
}
