import { describe, expect, test } from "vitest";
import type { Appointment } from "../entities/appointment";
import type { Offering } from "../entities/offering";
import type { Schedule, WeeklyTemplateItem } from "./../entities/schedule";

import type { OfferingRepository } from "../services/offering-ports";
import type { ScheduleRepository } from "../services/schedule-ports";
import type { AppointmentRepository } from "../services/appointment-ports";
import type { Clock, IdGenerator } from "../services/shared-ports";

import { AppointmentStatus } from "../entities/appointment";

import { createAppointment } from "./create-appointment";

class FakeOfferingRepo implements OfferingRepository {
  constructor(private rows: Offering[] = []) {}
  async findById(id: string) {
    return this.rows.find((o) => o.id === id) ?? null;
  }
}

class FakeScheduleRepo implements ScheduleRepository {
  constructor(private rows: Schedule[] = []) {}
  async findById(id: string) {
    return this.rows.find((s) => s.id === id) ?? null;
  }
}

class FakeAppointmentRepo implements AppointmentRepository {
  constructor(private rows: Appointment[] = []) {}
  async findOverlap(params: { scheduleId: string; from: Date; to: Date }) {
    return this.rows.filter(
      (a) =>
        a.scheduleId === params.scheduleId &&
        a.start < params.to &&
        params.from < a.end
    );
  }
  async create(appointment: Appointment) {
    this.rows.push(appointment);
  }

  seed(appt: Appointment) {
    this.rows.push(appt);
  }
}

const fixedNow = new Date("2025-01-01T09:00:00Z");
const fixedClock: Clock = { now: () => fixedNow };
const fixedIds: IdGenerator = { next: () => "appt-1" };

function fullDayTemplateFor(date: Date): WeeklyTemplateItem[] {
  const weekday = date.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
  return [{ weekday, windows: [{ start: "00:00", end: "23:59" }] }];
}

describe("CreateAppointment Use Case", () => {
  test("creates an appointment on a free future slot", async () => {
    const start = new Date("2025-01-01T10:00:00Z");

    const offering: Offering = {
      id: "off-1",
      name: "Consultation",
      durationMinutes: 30,
      status: "ACTIVE",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };

    const schedule: Schedule = {
      id: "sch-1",
      professionalId: "pro-1",
      weeklyTemplate: fullDayTemplateFor(start),
      bufferMinutes: 10,
      timezone: "America/Argentina/Buenos_Aires",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };

    const OfferingRepo = new FakeOfferingRepo([offering]);
    const ScheduleRepo = new FakeScheduleRepo([schedule]);
    const AppointmentRepo = new FakeAppointmentRepo();

    const result = await createAppointment({
      data: {
        scheduleId: "sch-1",
        offeringId: "off-1",
        customerId: "cus-1",
        start,
      },
      deps: {
        offeringRepo: OfferingRepo,
        scheduleRepo: ScheduleRepo,
        appointmentRepo: AppointmentRepo,
        ids: fixedIds,
        clock: fixedClock,
      },
    });

    expect(result).toMatchObject({
      id: "appt-1",
      scheduleId: "sch-1",
      offeringId: "off-1",
      professionalId: "pro-1",
      customerId: "cus-1",
      start,
      end: new Date("2025-01-01T10:30:00Z"),
      status: AppointmentStatus.PENDING,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    });
  });

  test("fails when offering does not exist", async () => {
    const start = new Date("2025-01-01T10:00:00Z");
    const schedule: Schedule = {
      id: "sch-1",
      professionalId: "pro-1",
      weeklyTemplate: fullDayTemplateFor(start),
      bufferMinutes: 10,
      timezone: "America/Argentina/Buenos_Aires",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };
    const OfferingRepo = new FakeOfferingRepo([]);
    const ScheduleRepo = new FakeScheduleRepo([schedule]);
    const AppointmentRepo = new FakeAppointmentRepo();

    await expect(
      createAppointment({
        data: {
          scheduleId: "sch-1",
          offeringId: "off-404",
          customerId: "cus-1",
          start,
        },
        deps: {
          offeringRepo: OfferingRepo,
          scheduleRepo: ScheduleRepo,
          appointmentRepo: AppointmentRepo,
          ids: fixedIds,
          clock: fixedClock,
        },
      })
    ).rejects.toThrow("OFFERING_NOT_FOUND");
  });

  test("fails when there is an overlap on the same schedule", async () => {
    const start = new Date("2025-01-01T10:15:00Z"); // solapa con 10:00–10:30
    const offering: Offering = {
      id: "off-1",
      name: "Consultation",
      durationMinutes: 30,
      status: "ACTIVE",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };
    const schedule: Schedule = {
      id: "sch-1",
      professionalId: "pro-1",
      weeklyTemplate: fullDayTemplateFor(start),
      bufferMinutes: 10,
      timezone: "America/Argentina/Buenos_Aires",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };

    const offeringRepo = new FakeOfferingRepo([offering]);
    const scheduleRepo = new FakeScheduleRepo([schedule]);

    const existing: Appointment = {
      id: "appt-existing",
      scheduleId: "sch-1",
      offeringId: "off-1",
      professionalId: "pro-1",
      customerId: "cus-x",
      start: new Date("2025-01-01T10:00:00Z"),
      end: new Date("2025-01-01T10:30:00Z"),
      status: AppointmentStatus.CONFIRMED,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };
    const appointmentRepo = new FakeAppointmentRepo([existing]);

    await expect(
      createAppointment({
        data: {
          scheduleId: "sch-1",
          offeringId: "off-1",
          customerId: "cus-1",
          start,
        },
        deps: {
          offeringRepo,
          scheduleRepo,
          appointmentRepo,
          ids: fixedIds,
          clock: fixedClock,
        },
      })
    ).rejects.toThrow("OVERLAP_APPOINTMENT");
  });

  test("fails when slot is outside schedule availability (windows/exceptions)", async () => {
    const start = new Date("2025-01-01T20:00:00Z"); // fuera de ventana 09:00–18:00
    const weekday = start.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const offering: Offering = {
      id: "off-1",
      name: "Consultation",
      durationMinutes: 30,
      status: "ACTIVE",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };
    const schedule: Schedule = {
      id: "sch-1",
      professionalId: "pro-1",
      weeklyTemplate: [
        { weekday, windows: [{ start: "09:00", end: "18:00" }] },
      ],
      bufferMinutes: 10,
      timezone: "America/Argentina/Buenos_Aires",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };

    const offeringRepo = new FakeOfferingRepo([offering]);
    const scheduleRepo = new FakeScheduleRepo([schedule]);
    const appointmentRepo = new FakeAppointmentRepo();

    await expect(
      createAppointment({
        data: {
          scheduleId: "sch-1",
          offeringId: "off-1",
          customerId: "cus-1",
          start,
        },
        deps: {
          offeringRepo,
          scheduleRepo,
          appointmentRepo,
          ids: fixedIds,
          clock: fixedClock,
        },
      })
    ).rejects.toThrow("RULE_SLOT_OUT_OF_AVAILABILITY");
  });

  test("respects buffer: rejects back-to-back start equal to previous end when buffer > 0", async () => {
    // Existing appointment: 10:00–10:30
    const existingStart = new Date("2025-01-01T10:00:00Z");
    const requestStart = new Date("2025-01-01T10:30:00Z"); // igual al end anterior
    const offering: Offering = {
      id: "off-1",
      name: "Consultation",
      durationMinutes: 30,
      status: "ACTIVE",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };
    const schedule: Schedule = {
      id: "sch-1",
      professionalId: "pro-1",
      weeklyTemplate: fullDayTemplateFor(existingStart),
      bufferMinutes: 10,
      timezone: "America/Argentina/Buenos_Aires",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };

    const offeringRepo = new FakeOfferingRepo([offering]);
    const scheduleRepo = new FakeScheduleRepo([schedule]);

    const existing: Appointment = {
      id: "appt-existing",
      scheduleId: "sch-1",
      offeringId: "off-1",
      professionalId: "pro-1",
      customerId: "cus-x",
      start: existingStart,
      end: new Date("2025-01-01T10:30:00Z"),
      status: AppointmentStatus.CONFIRMED,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };
    const appointmentRepo = new FakeAppointmentRepo([existing]);

    await expect(
      createAppointment({
        data: {
          scheduleId: "sch-1",
          offeringId: "off-1",
          customerId: "cus-1",
          start: requestStart,
        },
        deps: {
          offeringRepo,
          scheduleRepo,
          appointmentRepo,
          ids: fixedIds,
          clock: fixedClock,
        },
      })
    ).rejects.toThrow("OVERLAP_APPOINTMENT"); // por buffer 10'
  });

  test("respects buffer: allows start after buffer time (end + buffer)", async () => {
    // Existing appointment: 10:00–10:30, buffer 10' ⇒ próximo permitido: 10:40
    const existingStart = new Date("2025-01-01T10:00:00Z");
    const requestStart = new Date("2025-01-01T10:40:00Z"); // end + 10'
    const offering: Offering = {
      id: "off-1",
      name: "Consultation",
      durationMinutes: 30,
      status: "ACTIVE",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };
    const schedule: Schedule = {
      id: "sch-1",
      professionalId: "pro-1",
      weeklyTemplate: fullDayTemplateFor(existingStart),
      bufferMinutes: 10,
      timezone: "America/Argentina/Buenos_Aires",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };

    const offeringRepo = new FakeOfferingRepo([offering]);
    const scheduleRepo = new FakeScheduleRepo([schedule]);

    const existing: Appointment = {
      id: "appt-existing",
      scheduleId: "sch-1",
      offeringId: "off-1",
      professionalId: "pro-1",
      customerId: "cus-x",
      start: existingStart,
      end: new Date("2025-01-01T10:30:00Z"),
      status: AppointmentStatus.CONFIRMED,
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };
    const appointmentRepo = new FakeAppointmentRepo([existing]);

    const appt = await createAppointment({
      data: {
        scheduleId: "sch-1",
        offeringId: "off-1",
        customerId: "cus-1",
        start: requestStart,
      },
      deps: {
        offeringRepo,
        scheduleRepo,
        appointmentRepo,
        ids: fixedIds,
        clock: fixedClock,
      },
    });

    expect(appt.start).toEqual(requestStart);
    expect(appt.end).toEqual(new Date("2025-01-01T11:10:00Z")); // 30' de duración + start 10:40 = 11:10
  });
});
