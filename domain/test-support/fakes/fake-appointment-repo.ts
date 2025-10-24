import type { Appointment } from "../../src/entities/appointment";
import type { AppointmentRepository } from "../../src/services/appointment-ports";

export class FakeAppointmentRepo implements AppointmentRepository {
  constructor(private rows: Appointment[] = []) { }
  async findById(id: string) { return this.rows.find(a => a.id === id) ?? null; }
  async findOverlap(params: { scheduleId: string; from: Date; to: Date }) {
    return this.rows.filter(a =>
      a.scheduleId === params.scheduleId &&
      a.start < params.to &&
      params.from < a.end
    );
  }
  async listByScheduleAndRange(params: { scheduleId: string; from: Date; to: Date }) {
    return this.rows.filter(a =>
      a.scheduleId === params.scheduleId &&
      a.start < params.to &&
      params.from < a.end
    );
  }
  async create(a: Appointment) { this.rows.push(a); }
  async update(a: Appointment) { const i = this.rows.findIndex(x => x.id === a.id); if (i >= 0) this.rows[i] = a; }
  seed(a: Appointment) { this.rows.push(a); }
  all() { return this.rows; }
  async save(appt: Appointment): Promise<void> { this.rows.push(appt); }
}