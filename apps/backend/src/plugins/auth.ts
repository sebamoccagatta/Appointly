import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";
import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET ?? "dev-secret";

const authPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", async (request, reply) => {
    const url = request.url;
    const method = request.method;
    if (url === "/health" || url.startsWith("/auth/") || method === "GET" && url.startsWith("/offerings")) {
      return; // no exigir token
    }
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      reply.code(401).send({ error: "AUTH_INVALID_CREDENTIALS" });
      return;
    }

    const token = auth.slice(7);
    try {
      const decoded = jwt.verify(token, SECRET) as {
        sub: string;
        role: "ADMIN" | "USER" | "ASSISTANT" | string;
      };
      request.user = { id: decoded.sub, role: decoded.role as any };
    } catch {
      reply.code(401).send({ error: "AUTH_INVALID_CREDENTIALS" });
      return;
    }
  });
};

export default fp(authPlugin, { name: "auth" });