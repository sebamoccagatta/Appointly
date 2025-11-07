import { getPrisma } from "../prisma/client.js";
import type { Appointment } from "@app/domain/entities/appointment.js";
import type { AppointmentRepository } from "@app/domain/services/appointment-ports.js";

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

    async findById(id: string): Promise<Appointment | null> {
        const db = getPrisma();
        const row = await db.appointment.findUnique({ where: { id } });
        return row ? mapRow(row) : null;
    }
    async update(appt: Appointment): Promise<void> {
        return this.save(appt);
    }

    async save(appt: Appointment): Promise<void> {
        const db = getPrisma();
        await db.appointment.update({
            where: { id: appt.id },
            data: {
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

}
