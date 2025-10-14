import { AppointmentStatus, type Appointment } from "../entities/appointment";
import { UserRole } from "../entities/user";
import type { AppointmentRepository } from "../services/appointment-ports";
import type { Clock } from "../services/shared-ports";

import { diffHours } from "../utils/date";

type Deps = {
    repo: AppointmentRepository;
    clock: Clock;
    policy: { cancelMinHours: number };
}

export async function cancelAppointment(args: {
    data: {
        appointmentId: string;
        actorId: string;
        actorRole: typeof UserRole[keyof typeof UserRole];
        reason?: string;
    };
    deps: Deps;
}): Promise<Appointment> {
    const {data, deps } = args;
    const { appointmentId, actorId, actorRole, reason } = data;
    const { repo, clock, policy } = deps;

    const appt = await repo.findById(appointmentId);
    if (!appt) throw new Error("APPOINTMENT_NOT_FOUND");

    if (
        appt.status === AppointmentStatus.CANCELLED ||
        appt.status === AppointmentStatus.ATTENDED ||
        appt.status === AppointmentStatus.NO_SHOW
    ) {
        throw new Error("RULE_INVALID_TRANSITION");
    }

    const isActorParticipant = actorId === appt.customerId || actorId === appt.professionalId;
    const isAdmin = actorRole === UserRole.ADMIN;

    if (!isAdmin && !isActorParticipant) {
        throw new Error("FORBIDDEN_CANCELLATION");
    }

    const now = clock.now();
    if (actorRole === UserRole.USER) {
        const hoursUntilStart = diffHours(now, appt.start);
        if (hoursUntilStart < policy.cancelMinHours) {
        throw new Error("CANCEL_WINDOW_VIOLATION");
        }
    }

    const auditEvent = {
        at: now,
        byUserId: actorId,
        action: "CANCEL",
        ...(reason !== undefined ? { reason } : {}),
    };

    const updated: Appointment = {
        ...appt,
        status: AppointmentStatus.CANCELLED,
        updatedAt: now,
        audit: [ ...(appt.audit ?? []), auditEvent ]
    };

    await repo.update(updated);
    return updated;
}