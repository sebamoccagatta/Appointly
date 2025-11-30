import { PrismaClient } from '@prisma/client';



let prisma: PrismaClient;

export function getPrisma() {
    if (!prisma) {
        prisma = new PrismaClient();
    }
    return prisma;
}

export async function disconnectPrisma() {
    if (prisma) {
        await prisma.$disconnect();
    }
}