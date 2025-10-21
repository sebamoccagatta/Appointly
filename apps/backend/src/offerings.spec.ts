import { describe, test, expect } from "vitest";
import { buildApp } from "./app.js";
import crypto from "node:crypto";

async function registerAndLogin(app: any, role: "ADMIN" | "USER" = "ADMIN") {
  const email = `of.${crypto.randomUUID()}@ex.com`;
  const password = "secret123";
  const reg = await app.inject({
    method: "POST",
    url: "/auth/register",
    payload: { name: "Mgr", email, password, role }
  });
  expect(reg.statusCode).toBe(201);
  const login = await app.inject({
    method: "POST",
    url: "/auth/login",
    payload: { email, password }
  });
  expect(login.statusCode).toBe(200);
  return login.json().accessToken as string;
}

describe("Offerings CRUD", () => {
  test("ADMIN can create an offering", async () => {
    const app = buildApp();
    const token = await registerAndLogin(app, "ADMIN");

    const res = await app.inject({
      method: "POST",
      url: "/offerings",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Haircut", durationMinutes: 30 }
    });

    expect(res.statusCode).toBe(201);
    expect(res.json()).toMatchObject({
      id: expect.any(String),
      name: "Haircut",
      durationMinutes: 30,
      status: "ACTIVE"
    });
  });

  test("USER cannot create an offering", async () => {
    const app = buildApp();
    const token = await registerAndLogin(app, "USER");

    const res = await app.inject({
      method: "POST",
      url: "/offerings",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Consultation", durationMinutes: 45 }
    });

    expect(res.statusCode).toBe(403);
  });

  test("List ACTIVE offerings", async () => {
    const app = buildApp();
    const token = await registerAndLogin(app, "ADMIN");
    
    await app.inject({
      method: "POST",
      url: "/offerings",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Therapy", durationMinutes: 50 }
    });   

    const res = await app.inject({ method: "GET", url: "/offerings" });    
    
    expect(res.statusCode).toBe(200);
    const items = res.json();
    expect(Array.isArray(items)).toBe(true);
    expect(items.some((o: any) => o.name === "Therapy")).toBe(true);
  });

  test("ADMIN can deactivate an offering", async () => {
    const app = buildApp();
    const token = await registerAndLogin(app, "ADMIN");
    const create = await app.inject({
      method: "POST",
      url: "/offerings",
      headers: { authorization: `Bearer ${token}` },
      payload: { name: "Massage", durationMinutes: 60 }
    });
    const id = create.json().id;

    const res = await app.inject({
      method: "PATCH",
      url: `/offerings/${id}/deactivate`,
      headers: { authorization: `Bearer ${token}` }
    });

    expect(res.statusCode).toBe(200);

    const list = await app.inject({ method: "GET", url: "/offerings" });
    const items = list.json() as any[];
    expect(items.some(o => o.id === id)).toBe(false);
  });
});
