import { apiFetch } from "./apiClient";

export type WeeklyItem = {
    weekday: number; // 0-6
    start: string;   // "HH:MM"
    end: string;     // "HH:MM"
};

export type ExceptionItem = {
    date: string;      // "YYYY-MM-DD"
    available: boolean;
    start?: string;
    end?: string;
};

export type ScheduleDTO = {
    id: string;
    professionalId: string;
    timezone: string;
    bufferMinutes: number;
    weeklyTemplate: WeeklyItem[];
    exceptions: ExceptionItem[];
    createdAt: string;
    updatedAt: string;
};

export async function fetchMySchedule() {
    return apiFetch<ScheduleDTO>("/schedules/me");
}

export async function upsertMySchedule(input: {
    timezone: string;
    bufferMinutes: number;
    weeklyTemplate: WeeklyItem[];
    exceptions?: ExceptionItem[];
}) {
    return apiFetch<ScheduleDTO>("/schedules/me", {
        method: "PUT",
        body: JSON.stringify({
            timezone: input.timezone,
            bufferMinutes: input.bufferMinutes,
            weeklyTemplate: input.weeklyTemplate,
            exceptions: input.exceptions ?? [],
        }),
    });
}