import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../infra/prisma/client.js";

const AvailabilityQuery = z.object({
    date: z.string().min(1),        // "YYYY-MM-DD"
    offeringId: z.string().uuid(),
});

function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(total: number): string {
    const h = Math.floor(total / 60);
    const m = total % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// solapamiento simple entre 2 intervalos [aStart, aEnd) y [bStart, bEnd)
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
    return aStart < bEnd && bStart < aEnd;
}

export default async function availabilityRoutes(app: FastifyInstance) {
    const db = getPrisma();

    app.get("/availability", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({ error: "AUTH_REQUIRED" });
        }

        const { date, offeringId } = AvailabilityQuery.parse(request.query);
        const professionalId = request.user.id;

        // 1) Buscar schedule del profesional
        const schedule = await db.schedule.findFirst({
            where: { professionalId },
            include: {
                WeeklyTemplate: true,
                Exceptions: true,
            },
        });

        if (!schedule) {
            return reply
                .status(404)
                .send({ error: "SCHEDULE_NOT_FOUND", message: "No schedule for user" });
        }

        // 2) Buscar servicio para obtener duración
        const offering = await db.offering.findUnique({
            where: { id: offeringId },
        });

        if (!offering || offering.status !== "ACTIVE") {
            return reply
                .status(404)
                .send({ error: "OFFERING_NOT_FOUND_OR_INACTIVE" });
        }

        // 3) Calcular weekday de la fecha ("YYYY-MM-DD")
        // Nota: simplificado, se toma en local/UTC según tu runtime
        const dayDate = new Date(`${date}T00:00:00.000Z`);
        const weekday = dayDate.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

        // 4) Aplicar excepciones del día (por ahora solo full-day off / override completo)
        const exception = schedule.Exceptions.find(
            (e) => e.date.toISOString().slice(0, 10) === date
        );

        if (exception && !exception.available) {
            // Día completo no disponible
            return reply.status(200).send({
                date,
                offeringId,
                slots: [],
            });
        }

        // 5) Determinar franjas base del template
        let ranges = schedule.WeeklyTemplate
            .filter((w) => w.weekday === weekday)
            .map((w) => ({
                startMinutes: timeToMinutes(w.start),
                endMinutes: timeToMinutes(w.end),
            }));

        // Si hay excepción con start/end, podemos usar SOLO esa franja
        if (exception && exception.available && exception.start && exception.end) {
            ranges = [
                {
                    startMinutes: timeToMinutes(exception.start),
                    endMinutes: timeToMinutes(exception.end),
                },
            ];
        }

        if (ranges.length === 0) {
            return reply.status(200).send({
                date,
                offeringId,
                slots: [],
            });
        }

        const slotDuration = offering.durationMinutes; // duración real del turno
        const step = offering.durationMinutes + schedule.bufferMinutes; // avance entre slots

        // 6) Buscar turnos ya ocupados ese día (PENDING/CONFIRMED)
        const dayStart = new Date(`${date}T00:00:00.000Z`);
        const dayEnd = new Date(`${date}T23:59:59.999Z`);

        const existingAppointments = await db.appointment.findMany({
            where: {
                professionalId,
                status: { in: ["PENDING", "CONFIRMED"] },
                start: { lt: dayEnd },
                end: { gt: dayStart },
            },
        });


        const slots: { start: string; end: string }[] = [];

        // 7) Generar slots por cada franja
        for (const range of ranges) {
            for (
                let startMin = range.startMinutes;
                startMin + slotDuration <= range.endMinutes;
                startMin += step
            ) {
                const endMin = startMin + slotDuration;

                const startTimeStr = minutesToTime(startMin);
                const endTimeStr = minutesToTime(endMin);

                // Crear fechas concretas para comparar con appointments
                const startDateTime = new Date(`${date}T${startTimeStr}:00.000Z`);
                const endDateTime = new Date(`${date}T${endTimeStr}:00.000Z`);

                // Chequear si se solapa con algún turno existente
                const conflicts = existingAppointments.some((appt) =>
                    overlaps(startDateTime, endDateTime, appt.start, appt.end)
                );

                if (!conflicts) {
                    slots.push({
                        start: startTimeStr,
                        end: endTimeStr,
                    });
                }
            }
        }

        return reply.status(200).send({
            date,
            offeringId,
            timezone: schedule.timezone,
            bufferMinutes: schedule.bufferMinutes,
            slots,
        });
    });
}