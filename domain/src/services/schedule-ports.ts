import type { Schedule } from "../entities/schedule.js";

export interface ScheduleRepository {
  findById(id: string): Promise<Schedule | null>;
}
