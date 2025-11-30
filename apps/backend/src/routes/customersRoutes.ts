import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../infra/prisma/client.js";
import type { Prisma } from "@prisma/client"; // 👈 IMPORTANTE

const CreateCustomer = z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
});

const UpdateCustomer = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    notes: z.string().optional(),
});

export default async function customersRoutes(app: FastifyInstance) {
    const db = getPrisma();

    // GET /customers
    app.get("/customers", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({ error: "AUTH_REQUIRED" });
        }

        const q = (request.query as { q?: string }).q?.trim();

        const where: Prisma.CustomerWhereInput = q
            ? {
                OR: [
                    {
                        name: {
                            contains: q,
                            mode: "insensitive" satisfies Prisma.QueryMode,
                        },
                    },
                    {
                        email: {
                            contains: q,
                            mode: "insensitive" satisfies Prisma.QueryMode,
                        },
                    },
                    {
                        phone: {
                            contains: q,
                            mode: "insensitive" satisfies Prisma.QueryMode,
                        },
                    },
                ],
            }
            : {};

        const customers = await db.customer.findMany({
            where,
            orderBy: { createdAt: "desc" },
        });

        return reply.status(200).send(customers);
    });

    // POST /customers
    app.post("/customers", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({ error: "AUTH_REQUIRED" });
        }

        const parsed = CreateCustomer.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({
                error: "VALIDATION_ERROR",
                details: parsed.error.flatten(),
            });
        }

        const input = parsed.data;

        const data = {
            name: input.name,
            email: input.email ?? null,
            phone: input.phone ?? null,
            notes: input.notes ?? null,
        };

        try {
            const created = await db.customer.create({ data });
            return reply.status(201).send(created);
        } catch (err: any) {
            request.log.error({ err });
            return reply.status(500).send({ error: "INTERNAL_ERROR" });
        }
    });

    // PATCH /customers/:id
    app.patch("/customers/:id", async (request, reply) => {
        if (!request.user) {
            return reply.status(401).send({ error: "AUTH_REQUIRED" });
        }

        const { id } = request.params as { id: string };
        const parsed = UpdateCustomer.safeParse(request.body);

        if (!parsed.success) {
            return reply.status(400).send({
                error: "VALIDATION_ERROR",
                details: parsed.error.flatten(),
            });
        }

        const input = parsed.data;

        const updateData: Prisma.CustomerUpdateInput = {
            ...(input.name !== undefined ? { name: input.name } : {}),
            ...(input.email !== undefined ? { email: input.email || null } : {}),
            ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
            ...(input.notes !== undefined ? { notes: input.notes || null } : {}),
        };

        try {
            const updated = await db.customer.update({
                where: { id },
                data: updateData,
            });
            return reply.status(200).send(updated);
        } catch (err: any) {
            const code = String(err?.code || "");
            if (code === "P2025") {
                return reply.status(404).send({ error: "CUSTOMER_NOT_FOUND" });
            }
            request.log.error({ err });
            return reply.status(500).send({ error: "INTERNAL_ERROR" });
        }
    });
}
