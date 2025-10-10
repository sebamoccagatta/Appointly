import { describe, expect, test } from "vitest";
import type { Offering } from "../entities/offering";
import type { Schedule, WeeklyTemplateItem } from "../entities/schedule";
import type { Appointment } from "../entities/appointment";
import { AppointmentStatus } from "../entities/appointment";

import type { OfferingRepository } from "../services/offering-ports";
import type { ScheduleRepository } from "../services/schedule-ports";
import type { AppointmentRepository } from "../services/appointment-ports";
import { listAvailableSlots } from "./list-availability";

class FakeOfferingRepo implements OfferingRepository {
  constructor(private rows: Offering[] = []) {}
  async findById(id: string) {
    return this.rows.find(o => o.id === id) ?? null;
  }
}

class FakeScheduleRepo implements ScheduleRepository {
  constructor(private rows: Schedule[] = []) {}
  async findById(id: string) {
    return this.rows.find(s => s.id === id) ?? null;
  }
}

class FakeAppointmentRepo implements AppointmentRepository {
  constructor(private rows: Appointment[] = []) {}
  async findById(id: string) {
    return this.rows.find(a => a.id === id) ?? null;
  }
  async findOverlap() {
    // no se usa en estos tests
    return [];
  }
  async create(a: Appointment) {
    this.rows.push(a);
  }
  async update(a: Appointment) {
    const i = this.rows.findIndex(x => x.id === a.id);
    if (i >= 0) this.rows[i] = a;
  }
  async listByScheduleAndRange(params: { scheduleId: string; from: Date; to: Date }) {
    return this.rows.filter(a =>
      a.scheduleId === params.scheduleId &&
      a.start < params.to &&
      params.from < a.end
    );
  }
  seed(a: Appointment) { this.rows.push(a); }
}

function fullDayTemplateFor(date: Date): WeeklyTemplateItem[] {
  const weekday = date.getUTCDay() as 0|1|2|3|4|5|6;
  return [{ weekday, windows: [{ start: "00:00", end: "23:59" }] }];
}

const fixedNow = new Date("2025-01-01T09:00:00Z");

const baseOffering: Offering = {
  id: "off-30",
  name: "Consultation 30m",
  durationMinutes: 30,
  status: "ACTIVE",
  createdAt: fixedNow,
  updatedAt: fixedNow,
};

function baseScheduleFor(d: Date, overrides?: Partial<Schedule>): Schedule {
  return {
    id: "sch-1",
    professionalId: "pro-1",
    weeklyTemplate: fullDayTemplateFor(d),
    bufferMinutes: 0,
    timezone: "America/Argentina/Buenos_Aires",
    createdAt: fixedNow,
    updatedAt: fixedNow,
    ...overrides,
  };
}

function appt(p: Partial<Appointment>): Appointment {
  // utilidad para crear turnos ocupados
  return {
    id: p.id ?? "appt-x",
    scheduleId: p.scheduleId ?? "sch-1",
    offeringId: p.offeringId ?? "off-30",
    professionalId: p.professionalId ?? "pro-1",
    customerId: p.customerId ?? "cus-1",
    start: p.start ?? new Date("2025-01-01T10:00:00Z"),
    end: p.end ?? new Date("2025-01-01T10:30:00Z"),
    status: p.status ?? AppointmentStatus.CONFIRMED,
    createdAt: fixedNow,
    updatedAt: fixedNow,
    audit: p.audit ?? [],
  };
}


describe("ListAvailability Use Case", () => {
  test("returns 30m slots inside a simple window with no appointments", async () => {
    const day = new Date("2025-01-02T00:00:00Z");
    const schedule: Schedule = baseScheduleFor(day, {
      weeklyTemplate: [{
        weekday: day.getUTCDay() as 0|1|2|3|4|5|6,
        windows: [{ start: "09:00", end: "10:30" }],
      }],
      bufferMinutes: 0,
    });

    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const scheduleRepo = new FakeScheduleRepo([schedule]);
    const appointmentRepo = new FakeAppointmentRepo([]);

    const result = await listAvailableSlots({
      data: {
        scheduleId: "sch-1",
        offeringId: "off-30",
        from: new Date("2025-01-02T08:00:00Z"),
        to:   new Date("2025-01-02T12:00:00Z"),
      },
      deps: { offeringRepo, scheduleRepo, appointmentRepo },
    });

    const starts = result.map(s => s.start.toISOString());
    expect(starts).toEqual([
      "2025-01-02T09:00:00.000Z",
      "2025-01-02T09:30:00.000Z",
      "2025-01-02T10:00:00.000Z",
    ]); // 10:30 no entra porque el slot sería 10:30–11:00, fuera de la ventana 09:00–10:30
  });

  test("omits slots that overlap with existing appointments", async () => {
    const day = new Date("2025-01-02T00:00:00Z");
    const schedule: Schedule = baseScheduleFor(day, {
      weeklyTemplate: [{
        weekday: day.getUTCDay() as 0|1|2|3|4|5|6,
        windows: [{ start: "09:00", end: "11:00" }],
      }],
      bufferMinutes: 0,
    });

    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const scheduleRepo = new FakeScheduleRepo([schedule]);
    const appointmentRepo = new FakeAppointmentRepo([
      appt({ start: new Date("2025-01-02T09:30:00Z"), end: new Date("2025-01-02T10:00:00Z") }),
      appt({ id: "b", start: new Date("2025-01-02T10:30:00Z"), end: new Date("2025-01-02T11:00:00Z") }),
    ]);

    const result = await listAvailableSlots({
      data: {
        scheduleId: "sch-1",
        offeringId: "off-30",
        from: new Date("2025-01-02T08:00:00Z"),
        to:   new Date("2025-01-02T12:00:00Z"),
      },
      deps: { offeringRepo, scheduleRepo, appointmentRepo },
    });

    const starts = result.map(s => s.start.toISOString());
    expect(starts).toEqual([
      "2025-01-02T09:00:00.000Z",
      // 09:30–10:00 ocupado
      "2025-01-02T10:00:00.000Z",
      // 10:30–11:00 ocupado → siguiente (10:30) se descarta
    ]);
  });

  test("respects buffer: removes immediate next slot adjacent to an appointment when buffer > 0", async () => {
    const day = new Date("2025-01-02T00:00:00Z");
    const schedule: Schedule = baseScheduleFor(day, {
      weeklyTemplate: [{
        weekday: day.getUTCDay() as 0|1|2|3|4|5|6,
        windows: [{ start: "09:00", end: "12:00" }],
      }],
      bufferMinutes: 10,
    });

    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const scheduleRepo = new FakeScheduleRepo([schedule]);
    const appointmentRepo = new FakeAppointmentRepo([
      appt({ start: new Date("2025-01-02T09:30:00Z"), end: new Date("2025-01-02T10:00:00Z") }),
    ]);

    const result = await listAvailableSlots({
      data: {
        scheduleId: "sch-1",
        offeringId: "off-30",
        from: new Date("2025-01-02T08:00:00Z"),
        to:   new Date("2025-01-02T12:00:00Z"),
      },
      deps: { offeringRepo, scheduleRepo, appointmentRepo },
    });

    const starts = result.map(s => s.start.toISOString());
    // 10:00 está justo pegado al turno 09:30–10:00 → con buffer 10' NO se puede
    // El siguiente permitido sería 10:10, pero nuestros slots son cada 30' (09:00/09:30/10:00/10:30/…)
    // Así que el próximo slot válido será 10:30
    expect(starts).toContain("2025-01-02T10:30:00.000Z");
    expect(starts).not.toContain("2025-01-02T10:00:00.000Z");
  });

  test("exceptions: closed day returns no slots", async () => {
    const d = new Date("2025-01-02T10:00:00Z");
    const weekday = d.getUTCDay() as 0|1|2|3|4|5|6;

    const schedule: Schedule = {
      ...baseScheduleFor(d),
      weeklyTemplate: [{ weekday, windows: [{ start: "09:00", end: "18:00" }] }],
      exceptions: [{ date: "2025-01-02", available: false }],
    };

    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const scheduleRepo = new FakeScheduleRepo([schedule]);
    const appointmentRepo = new FakeAppointmentRepo([]);

    const result = await listAvailableSlots({
      data: {
        scheduleId: "sch-1",
        offeringId: "off-30",
        from: new Date("2025-01-02T00:00:00Z"),
        to:   new Date("2025-01-03T00:00:00Z"),
      },
      deps: { offeringRepo, scheduleRepo, appointmentRepo },
    });

    expect(result).toHaveLength(0);
  });

  test("exceptions: windows override template for that date", async () => {
    const d = new Date("2025-01-02T10:00:00Z");
    const weekday = d.getUTCDay() as 0|1|2|3|4|5|6;

    const schedule: Schedule = {
      ...baseScheduleFor(d),
      weeklyTemplate: [{ weekday, windows: [{ start: "09:00", end: "10:00" }] }],
      exceptions: [{ date: "2025-01-02", available: true, windows: [{ start: "19:00", end: "20:30" }] }],
    };

    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const scheduleRepo = new FakeScheduleRepo([schedule]);
    const appointmentRepo = new FakeAppointmentRepo([]);

    const result = await listAvailableSlots({
      data: {
        scheduleId: "sch-1",
        offeringId: "off-30",
        from: new Date("2025-01-02T00:00:00Z"),
        to:   new Date("2025-01-03T00:00:00Z"),
      },
      deps: { offeringRepo, scheduleRepo, appointmentRepo },
    });

    const starts = result.map(s => s.start.toISOString());
    expect(starts).toEqual([
      "2025-01-02T19:00:00.000Z",
      "2025-01-02T19:30:00.000Z",
      "2025-01-02T20:00:00.000Z",
    ]);
  });

  test("spans multiple days within from/to", async () => {
    const d1 = new Date("2025-01-02T00:00:00Z");
    const d2 = new Date("2025-01-03T00:00:00Z");
    const w1 = d1.getUTCDay() as 0|1|2|3|4|5|6;
    const w2 = d2.getUTCDay() as 0|1|2|3|4|5|6;

    const schedule: Schedule = {
      ...baseScheduleFor(d1),
      weeklyTemplate: [
        { weekday: w1, windows: [{ start: "09:00", end: "10:00" }] },
        { weekday: w2, windows: [{ start: "10:00", end: "11:00" }] },
      ],
    };

    const offeringRepo = new FakeOfferingRepo([baseOffering]);
    const scheduleRepo = new FakeScheduleRepo([schedule]);
    const appointmentRepo = new FakeAppointmentRepo([]);

    const result = await listAvailableSlots({
      data: {
        scheduleId: "sch-1",
        offeringId: "off-30",
        from: new Date("2025-01-02T00:00:00Z"),
        to:   new Date("2025-01-04T00:00:00Z"),
      },
      deps: { offeringRepo, scheduleRepo, appointmentRepo },
    });

    const starts = result.map(s => s.start.toISOString());
    expect(starts).toEqual([
      // Día 1: 09–10 → slots: 09:00, 09:30
      "2025-01-02T09:00:00.000Z",
      "2025-01-02T09:30:00.000Z",
      // Día 2: 10–11 → slots: 10:00, 10:30
      "2025-01-03T10:00:00.000Z",
      "2025-01-03T10:30:00.000Z",
    ]);
  });
});