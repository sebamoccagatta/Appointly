import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: { id: string; role: "ADMIN" | "USER" | "ASSISTANT" };
  }
}
export {};