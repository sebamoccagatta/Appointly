import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../infra/prisma/client.js";

export default async function schedulesRoutes(app: FastifyInstance) {

  const WeeklyItem = z.object({
    weekday: z.number().int().min(0).max(6),
    start: z.string().min(1),
    end: z.string().min(1),
  });

  const ExceptionItem = z.object({
    date: z.string().min(1), // "YYYY-MM-DD" (se parsea a Date)
    available: z.boolean(),
    start: z.string().optional(),
    end: z.string().optional(),
  });

  const CreateSchedule = z.object({
    timezone: z.string().min(1),
    bufferMinutes: z.number().int().nonnegative().default(0),
    weeklyTemplate: z.array(WeeklyItem).nonempty(),
    exceptions: z.array(ExceptionItem).optional().default([]),
  });

  // Crear schedule para el usuario autenticado (USER/ADMIN)
  app.post("/schedules", async (request, reply) => {    
    if (!request.user) {
      return reply.status(401).send({ error: "AUTH_REQUIRED" });
    }    

    const body = CreateSchedule.parse(request.body);
    const db = getPrisma();
    
    const created = await db.schedule.create({
      data: {
        professionalId: request.user.id,
        timezone: body.timezone,
        bufferMinutes: body.bufferMinutes,
        WeeklyTemplate: {
          create: body.weeklyTemplate.map((w) => ({
            weekday: w.weekday,
            start: w.start,
            end: w.end,
          })),
        },
        Exceptions: {
          create: body.exceptions.map((e) => ({
            date: new Date(e.date), // simple parse a UTC (suficiente para tests)
            available: e.available,
            start: e.start ?? null,
            end: e.end ?? null,
          })),
        },
      },
      include: {
        WeeklyTemplate: true,
        Exceptions: true,
      },
    });    

    return reply.status(201).send({
      id: created.id,
      professionalId: created.professionalId,
      timezone: created.timezone,
      bufferMinutes: created.bufferMinutes,
      weeklyTemplate: created.WeeklyTemplate.map((w) => ({
        weekday: w.weekday,
        start: w.start,
        end: w.end,
      })),
      exceptions: created.Exceptions.map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        available: e.available,
        start: e.start ?? undefined,
        end: e.end ?? undefined,
      })),
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    });
  });

  // Obtener schedule por id (solo owner o ADMIN)
  app.get("/schedules/:id", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: "AUTH_REQUIRED" });
    }

    const id = (request.params as { id: string }).id;
    const db = getPrisma();

    const sch = await db.schedule.findUnique({
      where: { id },
      include: { WeeklyTemplate: true, Exceptions: true },
    });

    if (!sch) {
      return reply.status(404).send({ error: "SCHEDULE_NOT_FOUND" });
    }

    // Autorización por owner o ADMIN
    const isOwner = sch.professionalId === request.user.id;
    const isAdmin = request.user.role === "ADMIN";
    if (!isOwner && !isAdmin) {
      return reply.status(403).send({ error: "FORBIDDEN" });
    }

    return reply.status(200).send({
      id: sch.id,
      professionalId: sch.professionalId,
      timezone: sch.timezone,
      bufferMinutes: sch.bufferMinutes,
      weeklyTemplate: sch.WeeklyTemplate.map((w) => ({
        weekday: w.weekday,
        start: w.start,
        end: w.end,
      })),
      exceptions: sch.Exceptions.map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        available: e.available,
        start: e.start ?? undefined,
        end: e.end ?? undefined,
      })),
      createdAt: sch.createdAt,
      updatedAt: sch.updatedAt,
    });
  });
}
