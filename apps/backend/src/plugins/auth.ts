// src/plugins/auth.ts
import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { getPrisma } from "../infra/prisma/client.js";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      sub: string;
      role: "ADMIN" | "USER" | "ASSISTANT";
      email?: string;
      name?: string;
    };
  }
  interface FastifyInstance {
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

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
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
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
      return reply.status(401).send({ error: "INVALID_TOKEN" });
    }
  });
};

export default fp(authPlugin);
