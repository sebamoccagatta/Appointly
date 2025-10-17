import bcrypt from "bcryptjs";
import { buildDomainDeps } from "../di/container.js";
import { createUser } from "domain/dist/use-cases/register.js";
import { getPrisma } from "../infra/prisma/client.js";
import { issueAccessToken } from "../infra/auth/jwt.js";

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

export async function loginController(input: { email: string; password: string }) {
    const db = getPrisma();

    const cred = await db.credentials.findUnique({ where: { email: input.email } });
    if(!cred) {
        const err = new Error("AUTH_INVALID_CREDENTIALS");
        throw err;
    }

    if(cred.status !== "ACTIVE") {
        throw new Error("AUTH_INVALID_CREDENTIALS");
    }

    const comparePass = await bcrypt.compare(input.password, cred.passwordHash);
    if(!comparePass) {
        throw new Error("AUTH_INVALID_CREDENTIALS");
    }

    const user = await db.user.findUnique({ where: { id: cred.userId } });
    if(!user) {
        throw new Error("AUTH_INVALID_CREDENTIALS");
    }

    return issueAccessToken({ userId: user.id, role: user.role as any });

}