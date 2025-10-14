import { Appointment, AppointmentStatus } from "../entities/appointment";
import type { OfferingRepository } from "../services/offering-ports";
import type { ScheduleRepository } from "../services/schedule-ports";
import type { AppointmentRepository } from "../services/appointment-ports";
import type { Clock, IdGenerator } from "../services/shared-ports";

import { addMinutes } from "../utils/date";
import { isWithinAvailability } from "../utils/schedule-availability";


type Deps = {
  offeringRepo: OfferingRepository;
  scheduleRepo: ScheduleRepository;
  appointmentRepo: AppointmentRepository;
  ids: IdGenerator;
  clock: Clock;
};

export async function createAppointment(args: {
  data: {
    scheduleId: string;
    offeringId: string;
    customerId: string;
    start: Date;
  };
  deps: Deps;
}): Promise<Appointment> {
  const { data, deps } = args;
  const { scheduleId, offeringId, customerId, start } = data;
  const { offeringRepo, scheduleRepo, appointmentRepo, ids, clock } = deps;

  const now = clock.now();
  if (!(start instanceof Date) || isNaN(start.getTime()) || start <= now) {
    throw new Error("RULE_PAST_APPOINTMENT");
  }

  const schedule = await scheduleRepo.findById(scheduleId);
  if (!schedule) throw new Error("SCHEDULE_NOT_FOUND");

  const offering = await offeringRepo.findById(offeringId);
  if (!offering) throw new Error("OFFERING_NOT_FOUND");

  if (offering.status !== "ACTIVE") {
    throw new Error("OFFERING_INACTIVE");
  }

  const end = addMinutes(start, offering.durationMinutes);

  if (!isWithinAvailability(schedule, start, end)) {
    throw new Error("RULE_SLOT_OUT_OF_AVAILABILITY");
  }

  const buffer = schedule.bufferMinutes ?? 0;
  const fromWithBuffer = addMinutes(start, -buffer);
  const toWithBuffer = addMinutes(end, buffer);
  const overlaps = await appointmentRepo.findOverlap({
    scheduleId: schedule.id,
    from: fromWithBuffer,
    to: toWithBuffer,
  });

  if (overlaps.length > 0) {
    throw new Error("OVERLAP_APPOINTMENT");
  }

  const appt: Appointment = {
    id: ids.next(),
    scheduleId: schedule.id,
    offeringId: offering.id,
    professionalId: schedule.professionalId,
    customerId,
    start,
    end,
    status: AppointmentStatus.PENDING,
    createdAt: now,
    updatedAt: now,
  };

  await appointmentRepo.create(appt);
  return appt;
}
