import { getPrisma } from "../prisma/client.js";
import type { Appointment } from "domain/src/entities/appointment.js";
import type { AppointmentRepository } from "domain/src/services/appointment-ports.js";

function mapRow(a: any): Appointment {
    return {
        id: a.id,
        scheduleId: a.scheduleId,
        offeringId: a.offeringId,
        professionalId: a.professionalId,
        customerId: a.customerId,
        start: a.start,
        end: a.end,
        status: a.status,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        audit: [],
    };
}

export class PrismaAppointmentRepo implements AppointmentRepository {
    async findOverlap(params: { scheduleId: string; from: Date; to: Date; }): Promise<Appointment[]> {
        const db = getPrisma();
        const rows = await db.appointment.findMany({
            where: {
                scheduleId: params.scheduleId,
                NOT: [
                    { end: { lte: params.from } },
                    { start: { gte: params.to } },
                ],
            }
        });
        return rows.map((a) => ({
            id: a.id,
            scheduleId: a.scheduleId,
            offeringId: a.offeringId,
            professionalId: a.professionalId,
            customerId: a.customerId,
            start: a.start,
            end: a.end,
            status: a.status as any,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
            audit: [],
        }));
    }

    async listByScheduleAndRange(params: { scheduleId: string; from: Date; to: Date; }): Promise<Appointment[]> {
        const db = getPrisma();
        const rows = await db.appointment.findMany({
            where: {
                scheduleId: params.scheduleId,
                start: { lt: params.to },
                end: { gt: params.from },
            },
            orderBy: { start: "asc" },
        });
        return rows.map(mapRow);
    }

    async create(appt: Appointment): Promise<void> {
        const db = getPrisma();
        await db.appointment.create({
            data: {
                id: appt.id,
                scheduleId: appt.scheduleId,
                offeringId: appt.offeringId,
                professionalId: appt.professionalId,
                customerId: appt.customerId,
                start: appt.start,
                end: appt.end,
                status: appt.status as any,
                createdAt: appt.createdAt,
                updatedAt: appt.updatedAt,
            },
        });
    }

    findById(id: string): Promise<Appointment | null> {
        throw new Error("Method not implemented.");
    }
    update(appointment: Appointment): Promise<void> {
        throw new Error("Method not implemented.");
    }
}
