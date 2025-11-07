import type { Offering } from "../entities/offering.js";

export interface OfferingRepository {
  findById(id: string): Promise<Offering | null>;
}
