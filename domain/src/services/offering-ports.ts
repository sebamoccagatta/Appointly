import type { Offering } from "../entities/offering";

export interface OfferingRepository {
  findById(id: string): Promise<Offering | null>;
}
