import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createAppointmentController, listAvailableSlotsController } from "../controllers/appointments-controller.js";

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
                slots.map((s) => ({
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
}
