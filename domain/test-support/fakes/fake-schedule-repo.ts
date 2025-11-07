import type { Schedule } from "../../src/entities/schedule.js";
import type { ScheduleRepository } from "../../src/services/schedule-ports.js";

export class FakeScheduleRepo implements ScheduleRepository {
  constructor(private rows: Schedule[] = []) { }
  async findById(id: string) { return this.rows.find(s => s.id === id) ?? null; }
}
