import type { Appointment } from "../entities/appointment";

export interface AppointmentRepository {
  findOverlap(params: {
    scheduleId: string;
    from: Date;
    to: Date;
  }): Promise<Appointment[]>;

  create(appointment: Appointment): Promise<void>;
}
