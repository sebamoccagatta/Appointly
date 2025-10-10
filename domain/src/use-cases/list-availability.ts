import type { Offering } from "../entities/offering";
import type { Schedule, WeeklyTemplateItem } from "../entities/schedule";
import type { OfferingRepository } from "../services/offering-ports";
import type { ScheduleRepository } from "../services/schedule-ports";
import type { AppointmentRepository } from "../services/appointment-ports";

type Deps = {
  offeringRepo: OfferingRepository;
  scheduleRepo: ScheduleRepository;
  appointmentRepo: AppointmentRepository;
};

export interface Slot {
  start: Date;
  end: Date;
}

export async function listAvailableSlots(args: {
  data: {
    scheduleId: string;
    offeringId: string;
    from: Date; // inclusive
    to: Date;   // exclusivo
  };
  deps: Deps;
}): Promise<Slot[]> {
  const { data, deps } = args;
  const { scheduleId, offeringId, from, to } = data;
  const { offeringRepo, scheduleRepo, appointmentRepo } = deps;

  // 1) Cargar schedule / offering y validar estado
  const schedule = await scheduleRepo.findById(scheduleId);
  if (!schedule) throw new Error("SCHEDULE_NOT_FOUND");

  const offering = await offeringRepo.findById(offeringId);
  if (!offering) throw new Error("OFFERING_NOT_FOUND");
  if (offering.status !== "ACTIVE") throw new Error("OFFERING_INACTIVE");

  // 2) Traer turnos ya reservados dentro del rango (para filtrar)
  const existing = await appointmentRepo.listByScheduleAndRange({ scheduleId, from, to });

  // 3) Generar candidatos por día / ventanas
  const duration = offering.durationMinutes;
  const buffer = schedule.bufferMinutes ?? 0;

  const result: Slot[] = [];
  for (const day of eachDayUTC(from, to)) {
    const windows = resolveWindowsForDate(schedule, day);
    if (!windows || windows.length === 0) continue;

    // Generar slots de duración fija dentro de cada ventana del día
    for (const w of windows) {
      const wStartMin = parseHHMM(w.start);
      const wEndMin = parseHHMM(w.end);

      // slotStart y slotEnd se computan en UTC
      for (let startMin = wStartMin; startMin + duration <= wEndMin; startMin += duration) {
        const slotStart = setTimeUTC(day, startMin);
        const slotEnd = addMinutes(slotStart, duration);

        // Respetar rango [from, to)
        if (!(from <= slotStart && slotEnd <= to)) continue;

        // Filtrar por overlap con buffer (expande los turnos existentes en ambos lados)
        const overlaps = existing.some(a => {
          const aFrom = addMinutes(a.start, -buffer);
          const aTo   = addMinutes(a.end,   buffer);
          return slotStart < aTo && aFrom < slotEnd;
        });
        if (overlaps) continue;

        result.push({ start: slotStart, end: slotEnd });
      }
    }
  }

  // Orden cronológico por las dudas (ya debería salir ordenado)
  result.sort((a, b) => a.start.getTime() - b.start.getTime());
  return result;
}

function resolveWindowsForDate(schedule: Schedule, d: Date) {
  const dateStr = toYYYYMMDDUTC(d);
  const exception = schedule.exceptions?.find(e => e.date === dateStr);
  if (exception) {
    if (exception.available === false) return [];
    const win = exception.windows ?? [];
    return win;
  }

  const weekday = d.getUTCDay() as WeeklyTemplateItem["weekday"];
  const dayTemplate = schedule.weeklyTemplate.find(w => w.weekday === weekday);
  return dayTemplate?.windows ?? [];
}

function eachDayUTC(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  let cursor = startOfUTCDay(from);
  // Hacemos "to" exclusivo convirtiéndolo a día inclusive con to-1ms
  const endInclusive = startOfUTCDay(new Date(to.getTime() - 1));
  while (cursor <= endInclusive) {
    days.push(cursor);
    cursor = addDaysUTC(cursor, 1);
  }
  return days;
}

function startOfUTCDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function addDaysUTC(d: Date, days: number): Date {
  const nd = new Date(d.getTime());
  nd.setUTCDate(nd.getUTCDate() + days);
  return nd;
}

function toYYYYMMDDUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = `${d.getUTCMonth() + 1}`.padStart(2, "0");
  const day = `${d.getUTCDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Convierte "HH:mm" en minutos desde medianoche
function parseHHMM(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = mStr !== undefined ? Number(mStr) : 0;
  if (isNaN(h) || isNaN(m)) {
    throw new Error(`Invalid time format: ${hhmm}`);
  }
  return h * 60 + m;
}

// Devuelve un Date con la misma fecha UTC que 'd' y el tiempo en minutos desde medianoche
function setTimeUTC(d: Date, minutesFromMidnight: number): Date {
  const base = startOfUTCDay(d);
  return new Date(base.getTime() + minutesFromMidnight * 60_000);
}

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}