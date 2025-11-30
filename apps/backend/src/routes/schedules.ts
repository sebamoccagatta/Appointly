import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../infra/prisma/client.js";

export default async function schedulesRoutes(app: FastifyInstance) {
  const WeeklyItem = z.object({
    weekday: z.number().int().min(0).max(6),
    start: z.string().min(1), // "HH:MM"
    end: z.string().min(1),   // "HH:MM"
  });

  const ExceptionItem = z.object({
    date: z.string().min(1), // "YYYY-MM-DD"
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

  const db = getPrisma();

  // Crear schedule para el usuario autenticado (USER/ADMIN)
  app.post("/schedules", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: "AUTH_REQUIRED" });
    }

    const body = CreateSchedule.parse(request.body);

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
            date: new Date(e.date),
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

  // Obtener schedule del profesional autenticado
  app.get("/schedules/me", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: "AUTH_REQUIRED" });
    }

    const db = getPrisma();

    let sch = await db.schedule.findFirst({
      where: { professionalId: request.user.id },
      include: { WeeklyTemplate: true, Exceptions: true },
    });

    // 👉 Si no existe, lo creamos con valores por defecto
    if (!sch) {
      sch = await db.schedule.create({
        data: {
          professionalId: request.user.id,
          timezone: "America/Argentina/Buenos_Aires",
          bufferMinutes: 0,
        },
        include: { WeeklyTemplate: true, Exceptions: true },
      });
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

  // Crear / actualizar schedule del profesional autenticado (upsert)
  app.put("/schedules/me", async (request, reply) => {
    if (!request.user) {
      return reply.status(401).send({ error: "AUTH_REQUIRED" });
    }

    const body = CreateSchedule.parse(request.body);

    const existing = await db.schedule.findFirst({
      where: { professionalId: request.user.id },
      include: { WeeklyTemplate: true, Exceptions: true },
    });

    // Si no existe, creamos uno nuevo (similar al POST)
    if (!existing) {
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
              date: new Date(e.date),
              available: e.available,
              start: e.start ?? null,
              end: e.end ?? null,
            })),
          },
        },
        include: { WeeklyTemplate: true, Exceptions: true },
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
    }

    // Si existe, lo actualizamos con transacción
    const updated = await db.$transaction(async (tx) => {
      // actualizar cabecera
      await tx.schedule.update({
        where: { id: existing.id },
        data: {
          timezone: body.timezone,
          bufferMinutes: body.bufferMinutes,
        },
      });

      // borrar templates y excepciones anteriores
      await tx.scheduleWeeklyTemplate.deleteMany({
        where: { scheduleId: existing.id },
      });

      await tx.scheduleException.deleteMany({
        where: { scheduleId: existing.id },
      });

      // recrear templates
      if (body.weeklyTemplate.length > 0) {
        await tx.scheduleWeeklyTemplate.createMany({
          data: body.weeklyTemplate.map((w) => ({
            scheduleId: existing.id,
            weekday: w.weekday,
            start: w.start,
            end: w.end,
          })),
        });
      }

      // recrear excepciones (si hay)
      if (body.exceptions.length > 0) {
        await tx.scheduleException.createMany({
          data: body.exceptions.map((e) => ({
            scheduleId: existing.id,
            date: new Date(e.date),
            available: e.available,
            start: e.start ?? null,
            end: e.end ?? null,
          })),
        });
      }

      const sch = await tx.schedule.findUnique({
        where: { id: existing.id },
        include: { WeeklyTemplate: true, Exceptions: true },
      });

      if (!sch) {
        throw new Error("SCHEDULE_NOT_FOUND_AFTER_UPDATE");
      }

      return sch;
    });

    return reply.status(200).send({
      id: updated.id,
      professionalId: updated.professionalId,
      timezone: updated.timezone,
      bufferMinutes: updated.bufferMinutes,
      weeklyTemplate: updated.WeeklyTemplate.map((w) => ({
        weekday: w.weekday,
        start: w.start,
        end: w.end,
      })),
      exceptions: updated.Exceptions.map((e) => ({
        date: e.date.toISOString().slice(0, 10),
        available: e.available,
        start: e.start ?? undefined,
        end: e.end ?? undefined,
      })),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    });
  });
}
