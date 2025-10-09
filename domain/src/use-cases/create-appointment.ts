import { Appointment, AppointmentStatus } from "../entities/appointment";
import type { OfferingRepository } from "../services/offering-ports";
import type { ScheduleRepository } from "../services/schedule-ports";
import type { AppointmentRepository } from "../services/appointment-ports";
import type { Clock, IdGenerator } from "../services/shared-ports";
import type { Schedule, WeeklyTemplateItem } from "../entities/schedule";

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

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

function isWithinAvailability(
  schedule: Schedule,
  start: Date,
  end: Date
): boolean {
  const weekday = start.getUTCDay() as WeeklyTemplateItem["weekday"];
  const dateStr = toYYYYMMDDUTC(start);

  // 1) Si hay exception para la fecha, decide según ella
  const exception = schedule.exceptions?.find((e) => e.date === dateStr);
  if (exception) {
    if (exception.available === false) return false; // día cerrado
    const windows = exception.windows ?? [];
    if (windows.length === 0) return false; // disponible=true pero sin ventanas → tratamos como cerrado
    return isContainedInWindows(start, end, windows);
  }

  // 2) Si no hay exception, usar plantilla semanal
  const dayTemplate = schedule.weeklyTemplate.find(
    (w) => w.weekday === weekday
  );
  if (!dayTemplate || dayTemplate.windows.length === 0) return false;

  return isContainedInWindows(start, end, dayTemplate.windows);
}

function parseHHMM(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = mStr !== undefined ? Number(mStr) : 0;
  if (isNaN(h) || isNaN(m)) {
    throw new Error(`Invalid time format: ${hhmm}`);
  }
  return h * 60 + m;
}

function minutesOfDayUTC(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}

function isContainedInWindows(
  start: Date,
  end: Date,
  windows: { start: string; end: string }[]
) {
  const startMin = minutesOfDayUTC(start);
  const endMin = minutesOfDayUTC(end);
  return windows.some((w) => {
    const wStart = parseHHMM(w.start);
    const wEnd = parseHHMM(w.end);
    return wStart <= startMin && endMin <= wEnd;
  });
}

function toYYYYMMDDUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${d.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}
