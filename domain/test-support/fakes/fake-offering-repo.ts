import type { Offering } from "../../src/entities/offering";
import type { OfferingRepository } from "../../src/services/offering-ports";

export class FakeOfferingRepo implements OfferingRepository {
  constructor(private rows: Offering[] = []) {}
  async findById(id: string) { return this.rows.find(o => o.id === id) ?? null; }
}