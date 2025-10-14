import fastify from "fastify";

export function buildApp() {
    const app = fastify({
        logger: {
            transport: { target: 'pino-pretty' },
            level: 'info'
        }
    });

    app.register(import("./routes/health"));

    return app;
}