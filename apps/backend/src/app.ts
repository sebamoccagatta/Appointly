import fastify from "fastify";
import authPlugin from "./plugins/auth.js";

export function buildApp() {
    const app = fastify({
        logger: {
            transport: { target: 'pino-pretty' },
            level: 'info'
        }
    });

    app.register(import("./routes/health.js"));
    app.register(import("./routes/auth.js"));
    app.register(authPlugin);

    app.get("/me", async (req, reply) => {
        return reply.send({ user: req.user });
    });
    return app;
}