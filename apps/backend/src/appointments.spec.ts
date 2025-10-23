import { describe, test, expect } from "vitest";
import { buildApp } from "./app.js";
import crypto from "crypto"

async function registerAndLogin(app: any, role: "ADMIN" | "USER" = "USER") {
	const email = `appt.${crypto.randomUUID()}@ex.com`;
	const password = "secret123";
	const reg = await app.inject({
		method: "POST",
		url: "/auth/register",
		payload: { name: "User", email, password, role }
	});

	expect(reg.statusCode).toBe(201);
	const login = await app.inject({
		method: "POST",
		url: "/auth/login",
		payload: { email, password }
	});
	expect(login.statusCode).toBe(200);
	return { token: login.json().accessToken as string, userId: reg.json().id as string };
}

async function createOffering(app: any, adminToken: string, name = "Consultation", durationMinutes = 30) {
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
				{ weekday, start: "14:00", end: "18:00" }
			]
		}
	});
	expect(res.statusCode).toBe(201);
	return res.json();
}

describe("Appointments API", () => {
	test("POST /appointments creates a PENDING appointment using domain rules", async () => {
		const app = buildApp();

		const admin = await registerAndLogin(app, "ADMIN");
		const offering = await createOffering(app, admin.token, "Therapy", 50);

		const user = await registerAndLogin(app, "USER");

		const weekday = 3; // miércoles
		const schedule = await createSchedule(app, user.token, weekday);

		const start = new Date("2025-10-29T12:00:00.000Z"); // miércoles, dentro de 09-13
		const res = await app.inject({
			method: "POST",
			url: "/appointments",
			headers: { authorization: `Bearer ${user.token}` },
			payload: {
				scheduleId: schedule.id,
				offeringId: offering.id,
				customerId: user.userId,
				start: start.toISOString()
			}
		});

		expect(res.statusCode).toBe(201);
		const appt = res.json();
		expect(appt).toMatchObject({
			scheduleId: schedule.id,
			offeringId: offering.id,
			professionalId: schedule.professionalId,
			customerId: user.userId,
			status: "PENDING"
		});
		expect(new Date(appt.start).toISOString()).toBe(start.toISOString());
		expect(typeof appt.id).toBe("string");
	});

	test("GET /schedules/:id/availability returns free slots from domain list-availability", async () => {
		const app = buildApp();

		const admin = await registerAndLogin(app, "ADMIN");
		const offering = await createOffering(app, admin.token, "Consult", 30);

		const user = await registerAndLogin(app, "USER");
		const weekday = 4; // jueves
		const schedule = await createSchedule(app, user.token, weekday);

		const day = "2025-10-30" // jueves
		const res = await app.inject({
			method: "GET",
			url: `/schedules/${schedule.id}/availability?day=${day}&offeringId=${offering.id}`,
			headers: { authorization: `Bearer ${user.token}` }
		});

		console.log(res.statusCode, res.body);

		expect(res.statusCode).toBe(200);
		const slots = res.json() as Array<{ start: string; end: string }>;
		expect(Array.isArray(slots)).toBe(true);
		expect(slots.length).toBeGreaterThan(0);
	});
});