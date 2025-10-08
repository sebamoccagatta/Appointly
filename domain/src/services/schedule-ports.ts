import type { Schedule } from "../entities/schedule";

export interface ScheduleRepository {
  findById(id: string): Promise<Schedule | null>;
}
