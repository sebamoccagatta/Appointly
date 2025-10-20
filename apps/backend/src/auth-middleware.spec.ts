import { describe, test, expect } from "vitest";
import { buildApp } from "./app.js";

describe("Auth middleware", () => {
  test("rejects requests without token", async () => {
    const app = buildApp();
    const res = await app.inject({ method: "GET", url: "/me" });
    expect(res.statusCode).toBe(401);
  });

  test("rejects requests with invalid token", async () => {
    const app = buildApp();
    const res = await app.inject({
      method: "GET",
      url: "/me",
      headers: { Authorization: "Bearer fake.invalid.token" },
    });
    expect(res.statusCode).toBe(401);
  });

  test("allows valid token and exposes user", async () => {
    const app = buildApp();
    const email = `auth.${crypto.randomUUID()}@ex.com`;

    await app.inject({
      method: "POST",
      url: "/auth/register",
      payload: { name: "Auth Tester", email: email, password: "test1234" },
    });
    const login = await app.inject({
      method: "POST",
      url: "/auth/login",
      payload: { email: email, password: "test1234" },
    });

    
    const { accessToken } = login.json();



    const res = await app.inject({
      method: "GET",
      url: "/me",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    

    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveProperty("user.id");
    expect(res.json()).toHaveProperty("user.role");
  });
});
