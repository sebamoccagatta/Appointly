import { getPrisma } from "../prisma/client.js";
import type { Schedule } from "domain/src/entities/schedule.js";
import type { ScheduleRepository } from "domain/src/services/schedule-ports.js";

export class PrismaScheduleRepo implements ScheduleRepository {
    async findById(id: string): Promise<Schedule | null> {
        const db = getPrisma();
        const s = await db.schedule.findUnique({
            where: { id },
            include: { WeeklyTemplate: true, Exceptions: true },
        });
        if (!s) return null;
        return {
            id: s.id,
            professionalId: s.professionalId,
            timezone: s.timezone,
            bufferMinutes: s.bufferMinutes,
            weeklyTemplate: s.WeeklyTemplate.map((w) => ({
                weekday: w.weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6,
                windows: [{ start: w.start, end: w.end }],
            })),
            exceptions: s.Exceptions.map((e) => ({
                date: e.date.toISOString().slice(0, 10),
                available: e.available,
                windows: e.start && e.end ? [{ start: e.start, end: e.end }] : [],
            })),
            createdAt: s.createdAt,
            updatedAt: s.updatedAt,
        };
    }
}
