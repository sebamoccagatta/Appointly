import { PrismaOfferingRepo } from "../infra/adapters/offering-repo.js";
import { PrismaScheduleRepo } from "../infra/adapters/schedule-repo.js";
import { PrismaAppointmentRepo } from "../infra/adapters/appointment-repo.js";
import { uuidGenerator, systemClock } from "../infra/system/shared.js";
import { backendAppointmentPolicy } from "../policies/appointments.js";

import { createAppointment } from "@app/domain/use-cases/create-appointment.js";
import { listAvailableSlots } from "@app/domain/use-cases/list-availability.js";
import { confirmAppointment } from "@app/domain/use-cases/confirm-appointment.js";
import { cancelAppointment } from "@app/domain/use-cases/cancel-appointment.js"

export async function createAppointmentController(input: {
    scheduleId: string;
    offeringId: string;
    customerId: string;
    start: Date;
}) {
    const offeringRepo = new PrismaOfferingRepo();
    const scheduleRepo = new PrismaScheduleRepo();
    const appointmentRepo = new PrismaAppointmentRepo();

    const appt = await createAppointment({
        data: {
            scheduleId: input.scheduleId,
            offeringId: input.offeringId,
            customerId: input.customerId,
            start: input.start,
        },
        deps: {
            offeringRepo,
            scheduleRepo,
            appointmentRepo,
            ids: uuidGenerator(),
            clock: systemClock(),
        },
    });

    return appt;
}

export async function listAvailableSlotsController(input: {
    scheduleId: string;
    day: string;
    offeringId: string;
}) {
    const scheduleRepo = new PrismaScheduleRepo();
    const offeringRepo = new PrismaOfferingRepo();
    const appointmentRepo = new PrismaAppointmentRepo();
    const from = new Date(`${input.day}T00:00:00.000Z`);
    const to = new Date(`${input.day}T23:59:59.999Z`);

    const slots = await listAvailableSlots({
        data: {
            scheduleId: input.scheduleId,
            offeringId: input.offeringId,
            from,
            to,
        },
        deps: { scheduleRepo, offeringRepo, appointmentRepo },
    });

    return slots;
}

export async function confirmAppointmentController(input: {
    appointmentId: string;
}) {
    const appointmentRepo = new PrismaAppointmentRepo();

    const appt = await confirmAppointment({
        data: { id: input.appointmentId },
        deps: { appointmentRepo, clock: systemClock() },
    });

    return appt;
}

export async function cancelAppointmentController(input: {
    appointmentId: string;
    actor: { id: string; role: "ADMIN" | "USER" | "ASSISTANT" };
    reason?: string;
}) {
    const repo = new PrismaAppointmentRepo();

    const result = await cancelAppointment({
        data: {
            appointmentId: input.appointmentId,
            actorId: input.actor.id,
            actorRole: input.actor.role,
            ...(input.reason !== undefined ? { reason: input.reason } : {}),
        },
        deps: {
            repo,
            policy: { cancelMinHours: 0 },
            clock: systemClock(),
        },
    });

    return result;
}