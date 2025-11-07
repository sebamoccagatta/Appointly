import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createAppointmentController, listAvailableSlotsController, confirmAppointmentController, cancelAppointmentController } from "../controllers/appointments-controller.js";
import { PrismaAppointmentRepo } from "../infra/adapters/appointment-repo.js";

export default async function appointmentsRoutes(app: FastifyInstance) {
    const CreateAppt = z.object({
        scheduleId: z.string().min(1),
        offeringId: z.string().min(1),
        customerId: z.string().min(1),
        start: z.string().min(1), // ISO date string
    });

    app.post("/appointments", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({ error: "AUTH_REQUIRED" });
        }

        const parsed = CreateAppt.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
        }
        const body = parsed.data;

        try {
            const appt = await createAppointmentController({
                scheduleId: body.scheduleId,
                offeringId: body.offeringId,
                customerId: body.customerId,
                start: new Date(body.start),
            });

            return reply.status(201).send({
                ...appt,
                start: appt.start.toISOString(),
                end: appt.end.toISOString(),
            });
        } catch (err: any) {
            const code = String(err?.message ?? "");
            const BAD = new Set([
                "RULE_PAST_APPOINTMENT",
                "RULE_SLOT_OUT_OF_AVAILABILITY",
                "OVERLAP_APPOINTMENT",
                "OFFERING_NOT_FOUND",
                "OFFERING_INACTIVE",
                "SCHEDULE_NOT_FOUND",
            ]);
            if (BAD.has(code)) return reply.status(400).send({ error: code });
            app.log.error({ err });
            return reply.status(500).send({ error: "INTERNAL_ERROR" });
        }
    });

    app.get("/schedules/:id/availability", async (request, reply) => {
        const { id } = request.params as { id: string };
        const { day, offeringId } = request.query as { day?: string; offeringId?: string };

        if (!day || !offeringId) {
            return reply.status(400).send({ error: "VALIDATION_ERROR", details: "day and offeringId are required" });
        }

        try {
            const slots = await listAvailableSlotsController({
                scheduleId: id,
                day,
                offeringId,
            });
            return reply.status(200).send(
                slots.map((s: { start: { toISOString: () => any; }; end: { toISOString: () => any; }; }) => ({
                    start: s.start.toISOString(),
                    end: s.end.toISOString(),
                }))
            );
        } catch (err: any) {
            const code = String(err?.message ?? "");
            const NOTF = new Set(["SCHEDULE_NOT_FOUND", "OFFERING_NOT_FOUND"]);
            if (NOTF.has(code)) return reply.status(404).send({ error: code });
            app.log.error({ err });
            return reply.status(500).send({ error: "INTERNAL_ERROR" });
        }
    });

    app.patch("/appointments/:id/confirm", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({ error: "AUTH_REQUIRED" });
        }

        const { id } = request.params as { id: string };

        const repo = new PrismaAppointmentRepo();
        const appt = await repo.findById(id);
        if (!appt) return reply.status(404).send({ error: "APPOINTMENT_NOT_FOUND" });

        const isOwner = request.user.id === appt.professionalId;
        const isAdmin = request.user.role === "ADMIN";
        if (!isOwner && !isAdmin) {
            return reply.status(403).send({ error: "FORBIDDEN" });
        }

        try {
            const updated = await confirmAppointmentController({ appointmentId: id });
            return reply.status(200).send({
                ...updated,
                start: updated.start.toISOString(),
                end: updated.end.toISOString(),
            });
        } catch (err: any) {
            const code = String(err?.message ?? "");
            if (code === "APPOINTMENT_NOT_FOUND") return reply.status(404).send({ error: code });
            if (code === "INVALID_STATUS_TRANSITION") return reply.status(400).send({ error: code });
            request.log.error({ err }, "confirm failed");
            return reply.status(500).send({ error: "INTERNAL_ERROR" });
        }
    });

    app.patch("/appointments/:id/cancel", async (request, reply) => {
        if (!request.user) return reply.status(401).send({ error: "AUTH_REQUIRED" });

        const { id } = request.params as { id: string };
        const body = (request.body ?? {}) as { reason?: string };

        try {
            const payload: {
                appointmentId: string;
                actor: { id: string; role: "ADMIN" | "USER" | "ASSISTANT" };
                reason?: string;
            } = {
                appointmentId: id,
                actor: { id: request.user.id, role: request.user.role },
                ...(body.reason !== undefined ? { reason: body.reason } : {}),
            };

            const updated = await cancelAppointmentController(payload);

            return reply.status(200).send({
                ...updated,
                start: updated.start.toISOString(),
                end: updated.end.toISOString(),
            });
        } catch (err: any) {
            const code = String(err?.message ?? "");
            if (code === "APPOINTMENT_NOT_FOUND") return reply.status(404).send({ error: code });
            if (code === "INVALID_STATUS_TRANSITION" || code === "RULE_INVALID_TRANSITION") return reply.status(400).send({ error: code });
            if (code === "FORBIDDEN" || code === "FORBIDDEN_CANCELLATION") return reply.status(403).send({ error: code });
            request.log.error({ err }, "cancel failed");
            return reply.status(500).send({ error: "INTERNAL_ERROR" });
        }
    });
}
