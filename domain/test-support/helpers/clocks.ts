import type { Clock } from "../../src/services/shared-ports.js";
export function fixedClock(date: Date): Clock { return { now: () => date }; }
