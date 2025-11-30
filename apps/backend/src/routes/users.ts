import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { getPrisma } from "../infra/prisma/client.js";
import bcrypt from "bcryptjs";

const RoleEnum = z.enum(["ADMIN", "ASSISTANT", "USER"]);
const StatusEnum = z.enum(["ACTIVE", "BLOCKED"]);

export default async function usersRoutes(app: FastifyInstance) {
    const db = getPrisma();

    // 💡 Helper: asegurar que solo ADMIN o ASSISTANT entren acá
    function ensureAdminOrAssistant(request: any, reply: any) {
        if (!request.user) {
            reply.code(401).send({ error: "AUTH_REQUIRED" });
            return false;
        }
        if (request.user.role !== "ADMIN" && request.user.role !== "ASSISTANT") {
            reply.code(403).send({ error: "FORBIDDEN" });
            return false;
        }
        return true;
    }

    // GET /users → listado con paginación + búsqueda
    app.get("/users", async (request, reply) => {
        if (!ensureAdminOrAssistant(request, reply)) return;

        const querySchema = z.object({
            page: z.coerce.number().min(1).default(1),
            pageSize: z.coerce.number().min(1).max(100).default(10),
            q: z.string().optional(),
            role: RoleEnum.optional(),
        });

        const parsed = querySchema.safeParse(request.query);
        if (!parsed.success) {
            return reply
                .status(400)
                .send({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
        }

        const { page, pageSize, q, role } = parsed.data;

        const where: any = {};

        if (q) {
            where.OR = [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
            ];
        }

        if (role) {
            where.role = role;
        }

        const [total, users] = await Promise.all([
            db.user.count({ where }),
            db.user.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * pageSize,
                take: pageSize,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    createdAt: true,
                    Credentials: {
                        select: {
                            status: true,
                        },
                    },
                },
            }),
        ]);

        const items = users.map((u) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.Credentials?.status ?? "ACTIVE",
            createdAt: u.createdAt.toISOString(),
        }));

        return reply.send({
            items,
            total,
            page,
            pageSize,
        });
    });

    // POST /users → crear usuario nuevo
    // ADMIN: puede elegir rol
    // ASSISTANT: solo crea usuarios rol USER
    app.post("/users", async (request, reply) => {
        if (!ensureAdminOrAssistant(request, reply)) return;

        const bodySchema = z.object({
            name: z.string().min(1),
            email: z.string().email(),
            role: RoleEnum.optional(),
        });

        const parsed = bodySchema.safeParse(request.body);
        if (!parsed.success) {
            return reply
                .status(400)
                .send({ error: "VALIDATION_ERROR", details: parsed.error.flatten() });
        }

        const { name, email } = parsed.data;
        let role = parsed.data.role ?? "USER";

        const actor = request.user!;

        if (actor.role === "ASSISTANT") {
            // 🔒 Assistant SIEMPRE crea usuarios normales
            role = "USER";
        }

        // generar contraseña temporal (por ahora, simple)
        const tempPassword = Math.random().toString(36).slice(-10);
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        try {
            const user = await db.user.create({
                data: {
                    name,
                    email,
                    role,
                    Credentials: {
                        create: {
                            email,
                            passwordHash,
                            status: "ACTIVE",
                        },
                    },
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    Credentials: {
                        select: { status: true },
                    },
                    createdAt: true,
                },
            });

            return reply.status(201).send({
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.Credentials?.status ?? "ACTIVE",
                    createdAt: user.createdAt.toISOString(),
                },
                initialPassword: tempPassword, // el panel puede mostrarla una sola vez
            });
        } catch (err: any) {
            if (String(err?.code) === "P2002") {
                // unique constraint
                return reply
                    .status(400)
                    .send({ error: "EMAIL_ALREADY_IN_USE", message: "Email ya registrado" });
            }
            app.log.error({ err }, "create user failed");
            return reply.status(500).send({ error: "INTERNAL_ERROR" });
        }
    });

    // PATCH /users/:id → editar name/email
    // ADMIN y ASSISTANT pueden editar name/email
    // Solo ADMIN puede cambiar rol
    app.patch("/users/:id", async (request, reply) => {
        if (!ensureAdminOrAssistant(request, reply)) return;

        const paramsSchema = z.object({
            id: z.string().uuid(),
        });
        const bodySchema = z.object({
            name: z.string().min(1).optional(),
            email: z.string().email().optional(),
            role: RoleEnum.optional(),
        });

        const parsedParams = paramsSchema.safeParse(request.params);
        if (!parsedParams.success) {
            return reply
                .status(400)
                .send({ error: "VALIDATION_ERROR", details: parsedParams.error.flatten() });
        }

        const parsedBody = bodySchema.safeParse(request.body);
        if (!parsedBody.success) {
            return reply
                .status(400)
                .send({ error: "VALIDATION_ERROR", details: parsedBody.error.flatten() });
        }

        const { id } = parsedParams.data;
        const { name, email, role } = parsedBody.data;
        const actor = request.user!;

        if (!name && !email && !role) {
            return reply
                .status(400)
                .send({ error: "NO_FIELDS_PROVIDED", message: "No hay campos para actualizar" });
        }

        // Assistant NO puede cambiar rol
        if (role && actor.role !== "ADMIN") {
            return reply.status(403).send({ error: "FORBIDDEN_ROLE_CHANGE" });
        }

        try {
            const user = await db.user.update({
                where: { id },
                data: {
                    ...(name ? { name } : {}),
                    ...(email ? { email } : {}),
                    ...(role && actor.role === "ADMIN" ? { role } : {}),
                },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    role: true,
                    Credentials: { select: { status: true } },
                    createdAt: true,
                },
            });

            return reply.send({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.Credentials?.status ?? "ACTIVE",
                createdAt: user.createdAt.toISOString(),
            });
        } catch (err: any) {
            if (String(err?.code) === "P2025") {
                return reply.status(404).send({ error: "USER_NOT_FOUND" });
            }
            if (String(err?.code) === "P2002") {
                return reply
                    .status(400)
                    .send({ error: "EMAIL_ALREADY_IN_USE", message: "Email ya registrado" });
            }
            app.log.error({ err }, "update user failed");
            return reply.status(500).send({ error: "INTERNAL_ERROR" });
        }
    });

    app.patch("/users/:id/status", async (request, reply) => {
        if (!ensureAdminOrAssistant(request, reply)) return;
        const actor = request.user!;
        if (actor.role !== "ADMIN") {
            return reply.status(403).send({ error: "FORBIDDEN" });
        }

        const paramsSchema = z.object({
            id: z.string().uuid(),
        });
        const bodySchema = z.object({
            status: StatusEnum,
        });

        const parsedParams = paramsSchema.safeParse(request.params);
        if (!parsedParams.success) {
            return reply
                .status(400)
                .send({ error: "VALIDATION_ERROR", details: parsedParams.error.flatten() });
        }

        const parsedBody = bodySchema.safeParse(request.body);
        if (!parsedBody.success) {
            return reply
                .status(400)
                .send({ error: "VALIDATION_ERROR", details: parsedBody.error.flatten() });
        }

        const { id } = parsedParams.data;
        const { status } = parsedBody.data;

        const user = await db.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                Credentials: { select: { status: true } },
            },
        });

        if (!user) {
            return reply.status(404).send({ error: "USER_NOT_FOUND" });
        }

        if (!user.Credentials) {
            await db.credentials.create({
                data: {
                    userId: user.id,
                    email: user.email,
                    passwordHash: "",
                    status,
                },
            });
        } else {
            await db.credentials.update({
                where: { userId: user.id },
                data: { status },
            });
        }

        return reply.send({ ok: true });
    });

    app.post("/users/:id/reset-password", async (request, reply) => {
        if (!ensureAdminOrAssistant(request, reply)) return;

        const paramsSchema = z.object({
            id: z.string().uuid(),
        });
        const parsedParams = paramsSchema.safeParse(request.params);
        if (!parsedParams.success) {
            return reply
                .status(400)
                .send({ error: "VALIDATION_ERROR", details: parsedParams.error.flatten() });
        }

        const { id } = parsedParams.data;

        const user = await db.user.findUnique({
            where: { id },
            select: { id: true, email: true },
        });

        if (!user) {
            return reply.status(404).send({ error: "USER_NOT_FOUND" });
        }

        app.log.info({ userId: user.id, email: user.email }, "RESET_PASSWORD_REQUEST");

        return reply.send({ ok: true, message: "RESET_LINK_SENT" });
    });
}
