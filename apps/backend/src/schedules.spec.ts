import { describe, test, expect } from "vitest";
import { buildApp } from "./app.js";
import crypto from "node:crypto";

async function authUser(app: any, role: "ADMIN" | "USER" = "USER") {
  const email = `sch.${crypto.randomUUID()}@ex.com`;
  const password = "secret123";
  const reg = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { name: "Pro", email, password, role }
  });
  expect(reg.statusCode).toBe(201);
  const login = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email, password }
  });
  expect(login.statusCode).toBe(200);
  return { token: login.json().accessToken as string };
}

describe("Schedules CRUD", () => {
  test("USER can create a schedule for self and retrieve it", async () => {
    const app = buildApp();
    const { token } = await authUser(app, "USER");

    const create = await app.inject({
      method: "POST",
      url: "/schedules",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      payload: {
        timezone: "America/Argentina/Buenos_Aires",
        bufferMinutes: 10,
        weeklyTemplate: [
          { weekday: 1, start: "09:00", end: "13:00" },
          { weekday: 1, start: "14:00", end: "18:00" }
        ],
        exceptions: [
          { date: "2025-01-01", available: false }
        ]
      }
    });

    expect(create.statusCode).toBe(201);
    const id = create.json().id;

    const get = await app.inject({
      method: "GET",
      url: `/schedules/${id}`,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(get.statusCode).toBe(200);
    const sch = get.json();
    expect(sch.timezone).toBe("America/Argentina/Buenos_Aires");
    expect(sch.weeklyTemplate.length).toBe(2);
    expect(sch.exceptions.length).toBe(1);
  });

  test("Cannot read someone else's schedule", async () => {
    const app = buildApp();
    const a = await authUser(app, "USER");
    const b = await authUser(app, "USER");

    const create = await app.inject({
      method: "POST",
      url: "/schedules",
      headers: { authorization: `Bearer ${a.token}` },
      payload: {
        timezone: "America/Argentina/Buenos_Aires",
        bufferMinutes: 0,
        weeklyTemplate: [{ weekday: 2, start: "10:00", end: "12:00" }]
      }
    });
    const id = create.json().id;

    const get = await app.inject({
      method: "GET",
      url: `/schedules/${id}`,
      headers: { authorization: `Bearer ${b.token}` }
    });

    expect(get.statusCode).toBe(403);
  });
});
