import { PrismaOfferingRepo } from "../infra/adapters/offering-repo.js";
import { PrismaScheduleRepo } from "../infra/adapters/schedule-repo.js";
import { PrismaAppointmentRepo } from "../infra/adapters/appointment-repo.js";
import { uuidGenerator, systemClock } from "../infra/system/shared.js";

import { createAppointment } from "domain/src/use-cases/create-appointment.js";
import { listAvailableSlots } from "domain/src/use-cases/list-availability.js";

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
