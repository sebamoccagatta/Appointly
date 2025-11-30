import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import jwt from "jsonwebtoken";
import { getPrisma } from "../infra/prisma/client.js";

const SECRET = process.env.JWT_SECRET ?? "dev-secret";

const authPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", async (request, reply) => {
    if (request.method === "OPTIONS") {
      return;
    }

    const url = request.url;
    const method = request.method;
    if (
      url === "/health" ||
      url.startsWith("/auth/") ||
      (method === "GET" && url.startsWith("/offerings")) ||
      (method === "GET" && url.includes("/schedules/") && url.endsWith("/availability"))
    ) {
      return;
    }
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      reply.code(401).send({ error: "AUTH_INVALID_CREDENTIALS" });
      return;
    }

    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, SECRET) as {
        sub: string;
        role: "ADMIN" | "USER" | "ASSISTANT";
      };

      const db = getPrisma();
      const user = await db.user.findUnique({
        where: { id: decoded.sub },
        select: { id: true, name: true, email: true, role: true },
      });

      if (!user) {
        reply.code(401).send({ error: "AUTH_INVALID_CREDENTIALS" });
        return;
      }

      request.user = user;
    } catch {
      reply.code(401).send({ error: "AUTH_INVALID_CREDENTIALS" });
      return;
    }
  });
};

export default fp(authPlugin, { name: "auth" });