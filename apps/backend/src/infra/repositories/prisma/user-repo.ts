import { UserRepository } from 'domain/dist/services/user-service.js';
import { User } from 'domain/dist/entities/user.js';
import { getPrisma } from '../../prisma/client.js'

export class PrismaUserRepository implements UserRepository {
    async findByEmail(email: string): Promise<User | null> {
        const db = getPrisma();
        const user = await db.user.findUnique({
            where: { email },
        });
        
        return user ? this.map(user) : null;
    }

    async findById(id: string): Promise<User | null> {
        const db = getPrisma();
        const user = await db.user.findUnique({
            where: { id },
        });
        return user ? this.map(user) : null;
    }

    async create(user: User): Promise<void> {
        const db = getPrisma();
        await db.user.create({
            data: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role as any,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            },
        });
    }

    private map(row: any): User {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    };
  }
}