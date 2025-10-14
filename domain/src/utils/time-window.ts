export function parseHHMM(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = mStr !== undefined ? Number(mStr) : 0;
  if (isNaN(h) || isNaN(m)) {
    throw new Error(`Invalid time format: ${hhmm}`);
  }
  return h * 60 + m;
}
export function minutesOfDayUTC(d: Date): number {
  return d.getUTCHours() * 60 + d.getUTCMinutes();
}
export function setTimeUTC(d: Date, minutesFromMidnight: number): Date {
  const base = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  return new Date(base.getTime() + minutesFromMidnight * 60_000);
}
