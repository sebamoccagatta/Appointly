import type { OfferingRepository } from "../services/offering-ports";
import type { ScheduleRepository } from "../services/schedule-ports";
import type { AppointmentRepository } from "../services/appointment-ports";

import { resolveWindowsForDate, eachDayUTC } from "../utils/schedule-availability";
import { addMinutes } from "../utils/date";
import { setTimeUTC, parseHHMM } from "../utils/time-window";

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
