import type { Schedule, WeeklyTemplateItem } from "../../src/entities/schedule";

export function fullDayTemplateFor(date: Date): WeeklyTemplateItem[] {
  const weekday = date.getUTCDay() as 0|1|2|3|4|5|6;
  return [{ weekday, windows: [{ start: "00:00", end: "23:59" }] }];
}

export function buildScheduleFor(d: Date, overrides: Partial<Schedule> = {}): Schedule {
  const now = new Date("2025-01-01T09:00:00Z");
  return {
    id: "sch-1",
    professionalId: "pro-1",
    weeklyTemplate: fullDayTemplateFor(d),
    bufferMinutes: 0,
    timezone: "America/Argentina/Buenos_Aires",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
