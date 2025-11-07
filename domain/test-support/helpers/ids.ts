import type { IdGenerator } from "../../src/services/shared-ports.js";
export function fixedIds(id: string): IdGenerator { return { next: () => id }; }
