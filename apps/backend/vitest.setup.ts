import { beforeAll, afterEach } from "vitest";
import { getPrisma } from "./src/infra/prisma/client.js"

afterEach(async () => {
  const prisma = getPrisma();
  await prisma.$transaction([
  prisma.scheduleException.deleteMany(),
  prisma.scheduleWeeklyTemplate.deleteMany(),
  prisma.schedule.deleteMany(),
  prisma.offering.deleteMany(),
  prisma.credentials.deleteMany(),
  prisma.user.deleteMany(),
]);
});