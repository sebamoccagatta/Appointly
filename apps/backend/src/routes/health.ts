import type { FastifyInstance } from "fastify";

export default async function healthRoutes(app: FastifyInstance) {
  app.get("/health", async (_req, reply) => {
    return reply.status(200).send({ status: "ok" });
  });
}