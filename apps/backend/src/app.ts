import fastify from "fastify";
import cors from "@fastify/cors";
import authPlugin from "./plugins/auth.js";

import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import offeringsRoutes from "./routes/offerings.js";
import schedulesRoutes from "./routes/schedules.js";
import appointmentsRoutes from "./routes/appointments.js";
import appointmentsDashboardRoutes from "./routes/appointments-dashboard.js";
import usersRoutes from "./routes/users.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import customersRoutes from "./routes/customersRoutes.js";

export function buildApp() {
  const app = fastify({
    logger: {
      transport: { target: "pino-pretty" },
      level: "info",
    },
  });

  // CORS PRIMERO
  app.register(cors, {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
    strictPreflight: false,
  });

  app.register(healthRoutes);
  app.register(authRoutes);
  app.register(authPlugin);
  app.register(offeringsRoutes);
  app.register(schedulesRoutes);
  app.register(appointmentsRoutes);
  app.register(appointmentsDashboardRoutes);
  app.register(usersRoutes);
  app.register(availabilityRoutes);
  app.register(customersRoutes);

  app.get("/me", async (req, reply) => {
    return reply.send({ user: req.user });
  });


  app.setErrorHandler((err, _req, reply) => {
    app.log.error({ err }, "Unhandled error");
    reply.status(500).send({ error: "INTERNAL_ERROR", message: err.message });
  });

  return app;
}