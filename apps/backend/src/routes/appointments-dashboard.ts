import type { FastifyInstance } from "fastify";
import { getPrisma } from "../infra/prisma/client.js";

export default async function appointmentsDashboardRoutes(app: FastifyInstance) {
    const db = getPrisma();

    app.get("/appointments/dashboard", async (request, reply) => {
        const user = request.user as any;
        if (!user) return reply.code(401).send({ error: "AUTH_REQUIRED" });

        const role = user.role as "ADMIN" | "ASSISTANT" | "USER";
        const userId = user.id as string;

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);

        const whereToday: any = {
            start: {
                gte: startOfDay,
                lte: endOfDay,
            },
        };

        const whereUpcoming: any = {
            start: {
                gte: now,
            },
        };

        if (role === "USER") {
            whereToday.customerId = userId;
            whereUpcoming.customerId = userId;
        }

        if (role === "ASSISTANT") {
            whereToday.professionalId = userId;
            whereUpcoming.professionalId = userId;
        }

        const [countToday, countPending, clientsGroup] = await Promise.all([
            db.appointment.count({
                where: whereToday,
            }),

            db.appointment.count({
                where: {
                    ...whereToday,
                    status: "PENDING",
                },
            }),

            db.appointment.groupBy({
                by: ["customerId"],
                where: whereToday,
                _count: {
                    _all: true,
                },
            }),
        ]);

        const revenue = 0;

        const upcomingRaw = await db.appointment.findMany({
            where: whereUpcoming,
            orderBy: {
                start: "asc",
            },
            take: 5,
            select: {
                id: true,
                start: true,
                status: true,
                offeringId: true,
                customerId: true,
            },
        });

        const offeringIds = Array.from(
            new Set(upcomingRaw.map((a) => a.offeringId))
        );

        const offerings = await db.offering.findMany({
            where: { id: { in: offeringIds } },
            select: {
                id: true,
                name: true,
            },
        });

        const offeringMap = new Map(offerings.map((o) => [o.id, o.name]));

        const upcoming = upcomingRaw.map((a) => {
            const date = new Date(a.start);
            const timeLabel = date.toLocaleString("es-AR", {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit",
            });

            return {
                id: a.id,
                clientName: "Cliente",
                service: offeringMap.get(a.offeringId) ?? "Servicio",
                time: timeLabel,
                status: a.status,
            };
        });

        return reply.send({
            stats: {
                today: countToday,
                pending: countPending,
                clients: clientsGroup.length,
                revenue,
            },
            upcoming,
        });
    });
}
