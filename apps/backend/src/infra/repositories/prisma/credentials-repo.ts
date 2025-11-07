import type { CredentialsRepository, CredentialsRecord } from "@app/domain/services/user-service.js";
import { getPrisma } from "../../prisma/client.js";

export class PrismaCredentialsRepository implements CredentialsRepository {
    async findByEmail(email: string): Promise<CredentialsRecord | null> {
        const db = getPrisma();
        const record = await db.credentials.findUnique({ where: { email } });

        return record ? { userId: record.userId, email: record.email, passwordHash: record.passwordHash, status: record.status as any } : null;
    }

    async create(rec: CredentialsRecord): Promise<void> {
        const db = getPrisma();
        await db.credentials.create({
            data: {
                userId: rec.userId,
                email: rec.email,
                passwordHash: rec.passwordHash,
                status: rec.status as any
            }
        });
    }
}
