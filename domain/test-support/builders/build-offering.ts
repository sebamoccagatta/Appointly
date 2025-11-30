import type { Offering } from "../../src/entities/offering.js";

export function buildOffering(overrides: Partial<Offering> = {}): Offering {
  const now = new Date("2025-01-01T09:00:00Z");
  return {
    id: "off-30",
    name: "Consultation 30m",
    durationMinutes: 30,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
