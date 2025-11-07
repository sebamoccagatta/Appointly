import { AppointmentStatus, type Appointment } from "../entities/appointment.js";
import { UserRole } from "../entities/user.js";
import type { AppointmentRepository } from "../services/appointment-ports.js";
import type { OfferingRepository } from "../services/offering-ports.js";
import type { ScheduleRepository } from "../services/schedule-ports.js";
import type { Clock, IdGenerator } from "../services/shared-ports.js";
import { createAppointment } from "./create-appointment.js";

import * as date from "../utils/date.js";

type Deps = {
  appointmentRepo: AppointmentRepository;
  offeringRepo: OfferingRepository;
  scheduleRepo: ScheduleRepository;
  clock: Clock;
  ids: IdGenerator; // no lo usamos directamente aquí (lo usa createAppointment)
  policy: { cancelMinHours: number };
};

export async function rescheduleAppointment(args: {
  data: {
    appointmentId: string;
    newStart: Date;
    actorId: string;
    actorRole: typeof UserRole[keyof typeof UserRole];
    reason?: string;
  };
  deps: Deps;
}): Promise<Appointment> {
  const { data, deps } = args;
  const { appointmentId, newStart, actorId, actorRole, reason } = data;
  const { appointmentRepo, offeringRepo, scheduleRepo, clock, ids, policy } = deps;

  const now = clock.now();
  const appt = await appointmentRepo.findById(appointmentId);
  if (!appt) throw new Error("APPOINTMENT_NOT_FOUND");

  if (
    appt.status === AppointmentStatus.CANCELLED ||
    appt.status === AppointmentStatus.ATTENDED ||
    appt.status === AppointmentStatus.NO_SHOW
  ) {
    throw new Error("RULE_INVALID_TRANSITION");
  }

  const isActorParticipant =
    actorId === appt.customerId || actorId === appt.professionalId;
  const isAdmin = actorRole === UserRole.ADMIN;
  if (!isAdmin && !isActorParticipant) {
    throw new Error("FORBIDDEN_RESCHEDULE");
  }

  if (actorRole === UserRole.USER) {
    const hoursUntilOldStart = date.diffHours(now, appt.start);
    if (hoursUntilOldStart < policy.cancelMinHours) {
      throw new Error("CANCEL_WINDOW_VIOLATION");
    }
  }

  if (!(newStart instanceof Date) || isNaN(newStart.getTime()) || newStart <= now) {
    throw new Error("RULE_PAST_APPOINTMENT");
  }

  const schedule = await scheduleRepo.findById(appt.scheduleId);
  if (!schedule) throw new Error("SCHEDULE_NOT_FOUND");

  const offering = await offeringRepo.findById(appt.offeringId);
  if (!offering) throw new Error("OFFERING_NOT_FOUND");
  if (offering.status !== "ACTIVE") throw new Error("OFFERING_INACTIVE");

  const newAppt = await createAppointment({
    data: {
      scheduleId: appt.scheduleId,
      offeringId: appt.offeringId,
      customerId: appt.customerId,
      start: newStart,
    },
    deps: { offeringRepo, scheduleRepo, appointmentRepo, ids, clock },
  });

  const auditEvent = {
    at: now,
    byUserId: actorId,
    action: "RESCHEDULE",
    ...(reason !== undefined ? { reason } : {}),
  };

  const updatedOld: Appointment = {
    ...appt,
    status: AppointmentStatus.CANCELLED,
    updatedAt: now,
    audit: [...(appt.audit ?? []), auditEvent],
  };

  await appointmentRepo.update(updatedOld);

  return newAppt;
}