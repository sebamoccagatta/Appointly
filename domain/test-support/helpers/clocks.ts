import type { Clock } from "../../src/services/shared-ports";
export function fixedClock(date: Date): Clock { return { now: () => date }; }
