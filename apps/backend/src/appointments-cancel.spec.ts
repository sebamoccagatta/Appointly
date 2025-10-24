import { describe, test, expect } from "vitest";
import { buildApp } from "./app.js";
import crypto from "node:crypto";

async function registerAndLogin(app: any, role: "ADMIN" | "USER" = "USER") {
    const email = `cancel.${crypto.randomUUID()}@ex.com`;
    const password = "secret123";
    const reg = await app.inject({ method: "POST", url: "/auth/register", payload: { name: "User", email, password, role } });
    expect(reg.statusCode).toBe(201);
    const login = await app.inject({ method: "POST", url: "/auth/login", payload: { email, password } });
    expect(login.statusCode).toBe(200);
    return { token: login.json().accessToken as string, userId: reg.json().id as string };
}

async function createOffering(app: any, adminToken: string, name = "Therapy", durationMinutes = 50) {
    const res = await app.inject({
        method: "POST",
        url: "/offerings",
        headers: { authorization: `Bearer ${adminToken}` },
        payload: { name, durationMinutes }
    });
    expect(res.statusCode).toBe(201);
    return res.json();
}

async function createSchedule(app: any, token: string, weekday: number) {
    const res = await app.inject({
        method: "POST",
        url: "/schedules",
        headers: { authorization: `Bearer ${token}` },
        payload: {
            timezone: "America/Argentina/Buenos_Aires",
            bufferMinutes: 10,
            weeklyTemplate: [
                { weekday, start: "09:00", end: "13:00" },
                { weekday, start: "14:00", end: "18:00" },
            ],
        },
    });
    expect(res.statusCode).toBe(201);
    return res.json();
}

async function createAppointment(app: any, token: string, data: { scheduleId: string; offeringId: string; customerId: string; startISO: string; }) {
    const res = await app.inject({
        method: "POST",
        url: "/appointments",
        headers: { authorization: `Bearer ${token}` },
        payload: { ...data, start: data.startISO }
    });
    expect(res.statusCode).toBe(201);
    return res.json();
}

describe.sequential("Appointments - Cancel", () => {
    test("owner can cancel a PENDING appointment", async () => {
        const app = buildApp();
        const admin = await registerAndLogin(app, "ADMIN");
        const offering = await createOffering(app, admin.token);

        const owner = await registerAndLogin(app, "USER");
        const schedule = await createSchedule(app, owner.token, 3);
        const appt = await createAppointment(app, owner.token, {
            scheduleId: schedule.id,
            offeringId: offering.id,
            customerId: owner.userId,
            startISO: "2030-01-09T12:00:00.000Z",
        });

        const res = await app.inject({
            method: "PATCH",
            url: `/appointments/${appt.id}/cancel`,
            headers: { authorization: `Bearer ${owner.token}` },
            payload: { reason: "no-show" }
        });

        expect(res.statusCode).toBe(200);
        const updated = res.json();
        expect(updated.id).toBe(appt.id);
        expect(updated.status).toBe("CANCELLED");
    });

    test("non-owner gets 403 when cancelling", async () => {
        const app = buildApp();
        const admin = await registerAndLogin(app, "ADMIN");
        const offering = await createOffering(app, admin.token);

        const owner = await registerAndLogin(app, "USER");
        const other = await registerAndLogin(app, "USER");

        const schedule = await createSchedule(app, owner.token, 3);
        const appt = await createAppointment(app, owner.token, {
            scheduleId: schedule.id,
            offeringId: offering.id,
            customerId: owner.userId,
            startISO: "2030-01-16T12:00:00.000Z",
        });

        const res = await app.inject({
            method: "PATCH",
            url: `/appointments/${appt.id}/cancel`,
            headers: { authorization: `Bearer ${other.token}` },
            payload: { reason: "nope" }
        });

        expect(res.statusCode).toBe(403);
    });

    test("cancelling a non-existent appointment → 404", async () => {
        const app = buildApp();
        const user = await registerAndLogin(app, "USER");

        const res = await app.inject({
            method: "PATCH",
            url: `/appointments/00000000-0000-0000-0000-000000000000/cancel`,
            headers: { authorization: `Bearer ${user.token}` },
            payload: { reason: "n/a" }
        });

        expect(res.statusCode).toBe(404);
    });

    test("cancelling an already CANCELLED/invalid transition → 400", async () => {
        const app = buildApp();
        const admin = await registerAndLogin(app, "ADMIN");
        const offering = await createOffering(app, admin.token);
        const owner = await registerAndLogin(app, "USER");
        const schedule = await createSchedule(app, owner.token, 3);
        const appt = await createAppointment(app, owner.token, {
            scheduleId: schedule.id,
            offeringId: offering.id,
            customerId: owner.userId,
            startISO: "2030-01-23T12:00:00.000Z",
        });

        const first = await app.inject({
            method: "PATCH",
            url: `/appointments/${appt.id}/cancel`,
            headers: { authorization: `Bearer ${owner.token}` },
            payload: { reason: "x" }
        });
        expect(first.statusCode).toBe(200);

        const second = await app.inject({
            method: "PATCH",
            url: `/appointments/${appt.id}/cancel`,
            headers: { authorization: `Bearer ${owner.token}` },
            payload: { reason: "y" }
        });
        expect(second.statusCode).toBe(400);
    });
});
