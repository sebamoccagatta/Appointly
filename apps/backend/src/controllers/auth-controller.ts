import bcrypt from "bcryptjs";
import { buildDomainDeps } from "../di/container.js";
import { createUser } from "domain/dist/use-cases/register.js";
import { getPrisma } from "../infra/prisma/client.js";

type Input = {
    name: string;
    email: string;
    password: string;
    role: "ADMIN" | "USER" | "ASSISTANT";
};

export async function registerController(input: Input) {
    const deps = buildDomainDeps();

    const user = await createUser({
        data: {
            name: input.name,
            email: input.email,
            password: input.password,
            role: input.role,
        },
        deps,
    });

    const hash = await bcrypt.hash(input.password, 10);
    const db = getPrisma();
    await db.credentials.create({
        data: {
        userId: user.id,
        email: user.email,
        passwordHash: hash,
        status: "ACTIVE",
        },
    });

    return user;
}