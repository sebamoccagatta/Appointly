import { beforeAll, afterEach } from "vitest";
import { getPrisma } from "./src/infra/prisma/client.js"

afterEach(async () => {
  const prisma = getPrisma();
  await prisma.$transaction([
    prisma.credentials.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});