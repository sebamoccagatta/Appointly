// src/plugins/auth.ts
import fp from "fastify-plugin";
import type { FastifyPluginAsync, FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

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
  app.decorate("authenticate", async (req, reply) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "MISSING_AUTH_HEADER" });
    }
    const token = header.slice("Bearer ".length);
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        sub: string;
        role: "ADMIN" | "USER" | "ASSISTANT";
        email?: string;
        name?: string;
      };
      req.user = payload;
    } catch {
      return reply.status(401).send({ error: "INVALID_TOKEN" });
    }
  });
};

export default fp(authPlugin);
