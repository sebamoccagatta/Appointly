import type { Appointment } from "../../src/entities/appointment.js";
import { AppointmentStatus } from "../../src/entities/appointment.js";

export function buildAppointment(overrides: Partial<Appointment> = {}): Appointment {
  const now = new Date("2025-01-01T09:00:00Z");
  return {
    id: "appt-1",
    scheduleId: "sch-1",
    offeringId: "off-30",
    professionalId: "pro-1",
    customerId: "cus-1",
    start: new Date("2025-01-02T12:00:00Z"),
    end: new Date("2025-01-02T12:30:00Z"),
    status: AppointmentStatus.CONFIRMED,
    createdAt: now,
    updatedAt: now,
    audit: [],
    ...overrides,
  };
}
