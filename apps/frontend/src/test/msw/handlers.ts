import { http, HttpResponse } from "msw";

export const handlers = [
    http.post("http://localhost:3000/auth/login", async () => {
        return HttpResponse.json({ accessToken: "fake.jwt", tokenType: "Bearer", expiresIn: 3600 }, { status: 200 });
    }),
    http.get("http://localhost:3000/auth/me", async () => {
        return HttpResponse.json({ id: "u1", name: "John", email: "john@example.com", role: "USER" }, { status: 200 });
    })
];
