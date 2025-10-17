import { describe, expect, test } from 'vitest';
import { buildApp } from './app.js';

describe("POST /auth/login", async () => {
    test("retunrs 200 and a token when credentials are valid", async () => {
        const app = buildApp();

        const reg = await app.inject({
            method: "POST",
            url: "/auth/register",
            payload: {
                name: "Seba Seba",
                email: "seba@seba.com",
                password: "supersecret",
                role: "USER"
            }
        })

        expect(reg.statusCode).toBe(201);

        const res = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: {
                email: "seba@seba.com",
                password: "supersecret",
            }
        });

        expect(res.statusCode).toBe(200);

        const body = res.json();
        expect(body).toMatchObject({
            accessToken: expect.any(String),
            tokenType: "Bearer",
            expiresIn: expect.any(Number)
        });
    });

    test("returns 401 when credentials are invalid", async () => {
        const app = buildApp();

        const res = await app.inject({
            method: "POST",
            url: "/auth/login",
            payload: { email: "ghost@example.com", password: "wrong" }
        });

        expect(res.statusCode).toBe(401);
        expect(res.json()).toMatchObject({
            error: "AUTH_INVALID_CREDENTIALS"
        });
    });
});