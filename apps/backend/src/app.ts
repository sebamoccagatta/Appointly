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

    })
    app.register(import("./routes/offerings.js"));
    app.register(import("./routes/schedules.js"));
    app.register(import("./routes/appointments.js"));

    // Handler de errores
    app.setErrorHandler((err, _req, reply) => {
        app.log.error({ err }, "Unhandled error");
        reply.status(500).send({ error: "INTERNAL_ERROR", message: err.message });
    });
    return app;
}