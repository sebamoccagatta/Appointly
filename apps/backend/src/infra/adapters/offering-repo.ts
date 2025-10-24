import { getPrisma } from "../prisma/client.js";
import { Offering } from "domain/dist/entities/offering.js";
import { OfferingRepository } from 'domain/dist/services/offering-ports.js';

export class PrismaOfferingRepo implements OfferingRepository {
    async findById(id: string): Promise<Offering | null> {
        const db = getPrisma();
        const o = await db.offering.findUnique({ where: { id } });
        if (!o) return null;
        return {
            id: o.id,
            name: o.name,
            durationMinutes: o.durationMinutes,
            status: o.status as "ACTIVE" | "INACTIVE",
            createdAt: o.createdAt,
            updatedAt: o.updatedAt,
        };
    }
}