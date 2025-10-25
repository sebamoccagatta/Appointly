import { http, HttpResponse } from "msw";

export const handlers = [
    http.post("http://localhost:3000/auth/login", async ({ request }) => {
        const body = await request.json() as any;
        if (body.email === "john@example.com" && body.password === "secret123") {
            return HttpResponse.json(
                { token: "fake.jwt.token", user: { id: "u1", name: "John", email: body.email, role: "USER" } },
                { status: 200 }
            );
        }
        return HttpResponse.json({ error: "INVALID_CREDENTIALS" }, { status: 401 });
    }),
    http.post("http://localhost:3000/auth/register", async ({ request }) => {
        const body = await request.json() as any;
        if (body.email && body.password && body.name) {
            return HttpResponse.json(
                { id: 'u2', name: body.name, email: body.email, role: 'USER' },
                { status: 201 }
            );
        }
        return HttpResponse.json({ error: 'INVALID_INPUT' }, { status: 400 })
    }),
];
