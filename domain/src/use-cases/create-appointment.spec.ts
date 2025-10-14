// domain/src/use-cases/create-appointment.spec.ts
import { describe, expect, test } from "vitest";

import type { Appointment } from "../entities/appointment";
import type { Offering } from "../entities/offering";
import type { Schedule } from "../entities/schedule";
import { AppointmentStatus } from "../entities/appointment";

import { createAppointment } from "./create-appointment";

import { FakeAppointmentRepo } from "../../test-support/fakes/fake-appointment-repo";
import { FakeOfferingRepo } from "../../test-support/fakes/fake-offering-repo";
import { FakeScheduleRepo } from "../../test-support/fakes/fake-schedule-repo";

import { fullDayTemplateFor } from "../../test-support/builders/build-schedule";
import { fixedClock } from "../../test-support/helpers/clocks";
import { fixedIds } from "../../test-support/helpers/ids";

const fixedNow = new Date("2025-01-01T09:00:00Z");

describe("CreateAppointment Use Case", () => {
  // helpers inyectados para todos los tests
  const ids = fixedIds("appt-1");
  const clock = fixedClock(fixedNow);

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

    const offeringRepo = new FakeOfferingRepo([offering]);
    const scheduleRepo = new FakeScheduleRepo([schedule]);
    const appointmentRepo = new FakeAppointmentRepo();

    const result = await createAppointment({
      data: {
        scheduleId: "sch-1",
        offeringId: "off-1",
        customerId: "cus-1",
        start,
      },
      deps: { offeringRepo, scheduleRepo, appointmentRepo, ids, clock },
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

    const offeringRepo = new FakeOfferingRepo([]); // no existe
    const scheduleRepo = new FakeScheduleRepo([schedule]);
    const appointmentRepo = new FakeAppointmentRepo();

    await expect(
      createAppointment({
        data: {
          scheduleId: "sch-1",
          offeringId: "off-404",
          customerId: "cus-1",
          start,
        },
        deps: { offeringRepo, scheduleRepo, appointmentRepo, ids, clock },
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
        deps: { offeringRepo, scheduleRepo, appointmentRepo, ids, clock },
      })
    ).rejects.toThrow("OVERLAP_APPOINTMENT");
  });

  test("fails when slot is outside schedule availability (windows/exceptions)", async () => {
    const start = new Date("2025-01-01T20:00:00Z"); // fuera de 09:00–18:00

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
      weeklyTemplate: [{ weekday, windows: [{ start: "09:00", end: "18:00" }] }],
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
        data: { scheduleId: "sch-1", offeringId: "off-1", customerId: "cus-1", start },
        deps: { offeringRepo, scheduleRepo, appointmentRepo, ids, clock },
      })
    ).rejects.toThrow("RULE_SLOT_OUT_OF_AVAILABILITY");
  });

  test("respects buffer: rejects back-to-back start equal to previous end when buffer > 0", async () => {
    // Existing appointment: 10:00–10:30
    const existingStart = new Date("2025-01-01T10:00:00Z");
    const requestStart = new Date("2025-01-01T10:30:00Z"); // igual al end

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
        data: { scheduleId: "sch-1", offeringId: "off-1", customerId: "cus-1", start: requestStart },
        deps: { offeringRepo, scheduleRepo, appointmentRepo, ids, clock },
      })
    ).rejects.toThrow("OVERLAP_APPOINTMENT"); // por buffer 10'
  });

  test("respects buffer: allows start after buffer time (end + buffer)", async () => {
    // 10:00–10:30, buffer 10' ⇒ próximo permitido: 10:40
    const existingStart = new Date("2025-01-01T10:00:00Z");
    const requestStart = new Date("2025-01-01T10:40:00Z");

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
      data: { scheduleId: "sch-1", offeringId: "off-1", customerId: "cus-1", start: requestStart },
      deps: { offeringRepo, scheduleRepo, appointmentRepo, ids, clock },
    });

    expect(appt.start).toEqual(requestStart);
    expect(appt.end).toEqual(new Date("2025-01-01T11:10:00Z")); // 30' + 10:40
  });

  test("respects schedule exception: day closed (available=false)", async () => {
    const start = new Date("2025-01-01T10:00:00Z");
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
      weeklyTemplate: [{ weekday, windows: [{ start: "09:00", end: "18:00" }] }],
      exceptions: [{ date: "2025-01-01", available: false }],
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
        data: { scheduleId: "sch-1", offeringId: "off-1", customerId: "cus-1", start },
        deps: { offeringRepo, scheduleRepo, appointmentRepo, ids, clock },
      })
    ).rejects.toThrow("RULE_SLOT_OUT_OF_AVAILABILITY");
  });

  test("respects schedule exception: windows override weekly template when available=true", async () => {
    const start = new Date("2025-01-01T20:00:00Z"); // fuera de 09–18; exception abre 19–21
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
      weeklyTemplate: [{ weekday, windows: [{ start: "09:00", end: "18:00" }] }],
      exceptions: [{ date: "2025-01-01", available: true, windows: [{ start: "19:00", end: "21:00" }] }],
      bufferMinutes: 10,
      timezone: "America/Argentina/Buenos_Aires",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };

    const offeringRepo = new FakeOfferingRepo([offering]);
    const scheduleRepo = new FakeScheduleRepo([schedule]);
    const appointmentRepo = new FakeAppointmentRepo();

    const appt = await createAppointment({
      data: { scheduleId: "sch-1", offeringId: "off-1", customerId: "cus-1", start },
      deps: { offeringRepo, scheduleRepo, appointmentRepo, ids, clock },
    });

    expect(appt.start).toEqual(start);
    expect(appt.end).toEqual(new Date("2025-01-01T20:30:00Z"));
  });

  test("fails when offering is INACTIVE", async () => {
    const start = new Date("2025-01-01T10:00:00Z");
    const weekday = start.getUTCDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6;

    const offering: Offering = {
      id: "off-1",
      name: "Consultation",
      durationMinutes: 30,
      status: "INACTIVE",
      createdAt: fixedNow,
      updatedAt: fixedNow,
    };

    const schedule: Schedule = {
      id: "sch-1",
      professionalId: "pro-1",
      weeklyTemplate: [{ weekday, windows: [{ start: "09:00", end: "18:00" }] }],
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
        data: { scheduleId: "sch-1", offeringId: "off-1", customerId: "cus-1", start },
        deps: { offeringRepo, scheduleRepo, appointmentRepo, ids, clock },
      })
    ).rejects.toThrow("OFFERING_INACTIVE");
  });
});
