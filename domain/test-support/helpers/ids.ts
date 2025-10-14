import type { IdGenerator } from "../../src/services/shared-ports";
export function fixedIds(id: string): IdGenerator { return { next: () => id }; }
