import fastify from "fastify";
import cors from "@fastify/cors";
import authPlugin from "./plugins/auth.js";

export function buildApp() {
    const app = fastify({
        logger: {
            transport: { target: 'pino-pretty' },
            level: 'info'
        }
    });

    app.register(cors, {
        origin: ["http://localhost:5173", "http://localhost:6006"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })

    app.register(authPlugin);
    app.register(import("./routes/health.js"));
    app.register(import("./routes/auth.js"));
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