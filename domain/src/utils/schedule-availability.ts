import type { Schedule, WeeklyTemplateItem } from "../entities/schedule.js";
import { addDaysUTC, startOfUTCDay, toYYYYMMDDUTC } from "./date.js";
import { parseHHMM, minutesOfDayUTC } from "./time-window.js";

export function isWithinAvailability(schedule: Schedule, start: Date, end: Date): boolean {
  const dateStr = toYYYYMMDDUTC(start);
  const exception = schedule.exceptions?.find(e => e.date === dateStr);
  if (exception) {
    if (exception.available === false) return false;
    const windows = exception.windows ?? [];
    if (windows.length === 0) return false;
    return isContainedInWindows(start, end, windows);
  }
  const weekday = start.getUTCDay() as WeeklyTemplateItem["weekday"];
  const dayTemplate = schedule.weeklyTemplate.find(w => w.weekday === weekday);
  if (!dayTemplate || dayTemplate.windows.length === 0) return false;
  return isContainedInWindows(start, end, dayTemplate.windows);
}

export function resolveWindowsForDate(schedule: Schedule, d: Date) {
  const dateStr = toYYYYMMDDUTC(d);
  const exception = schedule.exceptions?.find(e => e.date === dateStr);
  if (exception) {
    if (exception.available === false) return [];
    return exception.windows ?? [];
  }
  const weekday = d.getUTCDay() as WeeklyTemplateItem["weekday"];
  const dayTemplate = schedule.weeklyTemplate.find(w => w.weekday === weekday);
  return dayTemplate?.windows ?? [];
}

function isContainedInWindows(start: Date, end: Date, windows: { start: string; end: string }[]) {
  const startMin = minutesOfDayUTC(start);
  const endMin = minutesOfDayUTC(end);
  return windows.some(w => {
    const wStart = parseHHMM(w.start);
    const wEnd = parseHHMM(w.end);
    return wStart <= startMin && endMin <= wEnd;
  });
}

export function eachDayUTC(from: Date, to: Date): Date[] {
  const days: Date[] = [];
  let cursor = startOfUTCDay(from);
  // Hacemos "to" exclusivo convirtiéndolo a día inclusive con to-1ms
  const endInclusive = startOfUTCDay(new Date(to.getTime() - 1));
  while (cursor <= endInclusive) {
    days.push(cursor);
    cursor = addDaysUTC(cursor, 1);
  }
  return days;
}