import { describe, expect, test } from "vitest";
import { AppointmentStatus, type Appointment } from "../entities/appointment";
import { UserRole } from "../entities/user";
import type { AppointmentRepository } from "../services/appointment-ports";
import type { Clock } from "../services/shared-ports";

import { cancelAppointment } from "./cancel-appointment";

class FakeAppointmentRepo implements AppointmentRepository {
  constructor(private rows: Appointment[] = []) {}

  async findById(id: string) {
    return this.rows.find((a) => a.id === id) ?? null;
  }

  async findOverlap(_params: { scheduleId: string; from: Date; to: Date }) {
    return [];
  }

  async create(a: Appointment) {
    this.rows.push(a);
  }

  async update(a: Appointment) {
    const i = this.rows.findIndex((x) => x.id === a.id);
    if (i >= 0) this.rows[i] = a;
  }

  async listByScheduleAndRange(params: { scheduleId: string; from: Date; to: Date }): Promise<Appointment[]> {
    return [];
  }
}

const fixedNow = new Date("2025-01-01T10:00:00Z");
const clock: Clock = { now: () => fixedNow };

function apptBase(overrides: Partial<Appointment> = {}): Appointment {
  return {
    id: "appt-1",
    scheduleId: "sch-1",
    offeringId: "off-1",
    professionalId: "pro-1",
    customerId: "cus-1",
    start: new Date("2025-01-02T12:00:00Z"),
    end: new Date("2025-01-02T12:30:00Z"),
    status: AppointmentStatus.CONFIRMED,
    createdAt: new Date("2024-12-31T10:00:00Z"),
    updatedAt: new Date("2024-12-31T10:00:00Z"),
    audit: [],
    ...overrides,
  };
}

const policy = { cancelMinHours: 24 }; // política de cancelación

describe("CancelAppointment Use Case", () => {
  test("customer can cancel when start is at least cancelMinHours away", async () => {
    const repo = new FakeAppointmentRepo([
      apptBase({ start: new Date("2025-01-02T12:00:00Z") }), // falta > 24h
    ]);

    const result = await cancelAppointment({
      data: {
        appointmentId: "appt-1",
        actorId: "cus-1",
        actorRole: UserRole.USER,
        reason: "change of plans",
      },
      deps: { repo, clock, policy },
    });

    expect(result.status).toBe(AppointmentStatus.CANCELLED);
    expect(result.updatedAt).toEqual(fixedNow);
    expect(result.audit?.at(-1)).toMatchObject({
      byUserId: "cus-1",
      action: "CANCEL",
      reason: "change of plans",
    });
  });

  test("customer cannot cancel inside window (less than cancelMinHours)", async () => {
    const repo = new FakeAppointmentRepo([
      apptBase({ start: new Date("2025-01-01T20:00:00Z") }), // faltan 10h
    ]);

    await expect(
      cancelAppointment({
        data: {
          appointmentId: "appt-1",
          actorId: "cus-1",
          actorRole: UserRole.USER,
        },
        deps: { repo, clock, policy },
      })
    ).rejects.toThrow("CANCEL_WINDOW_VIOLATION");
  });

  test("assistant can cancel even inside window", async () => {
    const repo = new FakeAppointmentRepo([
      apptBase({ start: new Date("2025-01-01T20:00:00Z") }), // faltan 10h
    ]);

    const result = await cancelAppointment({
      data: {
        appointmentId: "appt-1",
        actorId: "pro-1",
        actorRole: UserRole.ASSISTANT,
        reason: "emergency",
      },
      deps: { repo, clock, policy },
    });

    expect(result.status).toBe(AppointmentStatus.CANCELLED);
    expect(result.audit?.at(-1)).toMatchObject({
      byUserId: "pro-1",
      action: "CANCEL",
      reason: "emergency",
    });
  });

  test("admin can cancel even inside window", async () => {
    const repo = new FakeAppointmentRepo([
      apptBase({ start: new Date("2025-01-01T20:00:00Z") }), // faltan 10h
    ]);

    const result = await cancelAppointment({
      data: {
        appointmentId: "appt-1",
        actorId: "adm-1",
        actorRole: UserRole.ADMIN,
      },
      deps: { repo, clock, policy },
    });

    expect(result.status).toBe(AppointmentStatus.CANCELLED);
  });

  test("non-participant cannot cancel (forbidden)", async () => {
    const repo = new FakeAppointmentRepo([apptBase()]);

    await expect(
      cancelAppointment({
        data: {
          appointmentId: "appt-1",
          actorId: "intruder",
          actorRole: UserRole.USER,
        },
        deps: { repo, clock, policy },
      })
    ).rejects.toThrow("FORBIDDEN_CANCELLATION");
  });

  test("cannot cancel if already cancelled/attended/no-show", async () => {
    const repo = new FakeAppointmentRepo([
      apptBase({ status: AppointmentStatus.CANCELLED }),
      apptBase({ id: "appt-2", status: AppointmentStatus.ATTENDED }),
      apptBase({ id: "appt-3", status: AppointmentStatus.NO_SHOW }),
    ]);

    await expect(
      cancelAppointment({
        data: {
          appointmentId: "appt-1",
          actorId: "cus-1",
          actorRole: UserRole.USER,
        },
        deps: { repo, clock, policy },
      })
    ).rejects.toThrow("RULE_INVALID_TRANSITION");

    await expect(
      cancelAppointment({
        data: {
          appointmentId: "appt-2",
          actorId: "cus-1",
          actorRole: UserRole.USER,
        },
        deps: { repo, clock, policy },
      })
    ).rejects.toThrow("RULE_INVALID_TRANSITION");

    await expect(
      cancelAppointment({
        data: {
          appointmentId: "appt-3",
          actorId: "cus-1",
          actorRole: UserRole.USER,
        },
        deps: { repo, clock, policy },
      })
    ).rejects.toThrow("RULE_INVALID_TRANSITION");
  });

  test("fails when appointment not found", async () => {
    const repo = new FakeAppointmentRepo([]);

    await expect(
      cancelAppointment({
        data: {
          appointmentId: "missing",
          actorId: "cus-1",
          actorRole: UserRole.USER,
        },
        deps: { repo, clock, policy },
      })
    ).rejects.toThrow("APPOINTMENT_NOT_FOUND");
  });
});
