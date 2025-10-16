import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { registerController } from "../controllers/auth-controller.js";
import { mapDomainErrorToHttp } from "../errors/map-domain-error.js";

export default async function authRoutes(app: FastifyInstance) {
    const RegisterBody = z.object({
        name: z.string(),
        email: z.string(),
        password: z.string(),
        role: z.enum(["ADMIN", "USER", "ASSISTANT"]).default('USER')
    });
    app.post("/auth/register", async (request, reply) => {
        try {
        const body = RegisterBody.parse(request.body);
        const user = await registerController(body);

        return reply.status(201).send({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        });
        } catch (err: any) {
        const mapped = mapDomainErrorToHttp(err);
        return reply.status(mapped.status).send({ error: mapped.code, message: mapped.message });
        }
    });


}