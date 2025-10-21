import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../infra/prisma/client.js";

export default async function offeringsRoutes(app: FastifyInstance) {
  const CreateOffering = z.object({
    name: z.string().min(1, "name required"),
    durationMinutes: z.number().int().positive(),
  });

  app.post("/offerings", async (request, reply) => {
    if (request.user?.role !== "ADMIN") {
      return reply.status(403).send({ error: "FORBIDDEN" });
    }

    const body = CreateOffering.parse(request.body);
    const db = getPrisma();

    const created = await db.offering.create({
      data: {
        name: body.name,
        durationMinutes: body.durationMinutes,
        status: "ACTIVE",
      },
    });

    return reply.status(201).send({
      id: created.id,
      name: created.name,
      durationMinutes: created.durationMinutes,
      status: created.status,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });

  app.get("/offerings", async (_request, reply) => {
    const db = getPrisma();
    const items = await db.offering.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    return reply.status(200).send(
      items.map((o) => ({
        id: o.id,
        name: o.name,
        durationMinutes: o.durationMinutes,
        status: o.status,
        createdAt: o.createdAt,
        updatedAt: o.updatedAt,
      }))
    );
  });

  app.patch("/offerings/:id/deactivate", async (request, reply) => {
    if (request.user?.role !== "ADMIN") {
        return reply.status(403).send({ error: "FORBIDDEN" });
    }

    const { id } = request.params as { id: string };
    const db = getPrisma();

    const result = await db.offering.updateMany({
        where: { id, status: "ACTIVE" },
        data: { status: "INACTIVE" },
    });

    if (result.count === 0) {
        return reply.status(404).send({ error: "OFFERING_NOT_FOUND" });
    }

    return reply.status(200).send({ id, status: "INACTIVE" });
  });
}
