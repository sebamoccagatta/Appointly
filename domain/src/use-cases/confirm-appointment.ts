import type { Appointment } from "../entities/appointment";
import type { AppointmentRepository } from "../services/appointment-ports";
import type { Clock } from "../services/shared-ports";

type Deps = { appointmentRepo: AppointmentRepository; clock: Clock };

export async function confirmAppointment(params: {
    data: { id: string };
    deps: Deps;
}): Promise<Appointment> {
    const { id } = params.data;
    const { appointmentRepo, clock } = params.deps;

    const appt = await appointmentRepo.findById(id);
    if (!appt) throw new Error("APPOINTMENT_NOT_FOUND");

    if (appt.status === "CONFIRMED") throw new Error("INVALID_STATUS_TRANSITION");
    if (appt.status === "CANCELLED") throw new Error("INVALID_STATUS_TRANSITION");
    if (appt.status !== "PENDING") throw new Error("INVALID_STATUS_TRANSITION");

    const now = clock.now();
    const updated: Appointment = { ...appt, status: "CONFIRMED", updatedAt: now };

    await appointmentRepo.save(updated);
    return updated;
}
