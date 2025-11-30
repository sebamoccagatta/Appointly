import type { Clock, IdGenerator } from '@app/domain/services/shared-ports.js';
import type { UserRepository, CredentialsRepository } from '@app/domain/services/user-service.js';
import { PrismaUserRepository } from '../infra/repositories/prisma/user-repo.js';
import { PrismaCredentialsRepository } from '../infra/repositories/prisma/credentials-repo.js';
import { systemClock, uuidGenerator } from '../infra/system/shared.js';


let singletons: {
  userRepo?: UserRepository;
  credentialsRepo?: CredentialsRepository;
  clock?: Clock;
  ids?: IdGenerator;
} = {};

export function buildDomainDeps() {
  if (!singletons.userRepo) singletons.userRepo = new PrismaUserRepository();
  if (!singletons.credentialsRepo) singletons.credentialsRepo = new PrismaCredentialsRepository();
  if (!singletons.clock) singletons.clock = systemClock();
  if (!singletons.ids) singletons.ids = uuidGenerator();

  return {
    repo: singletons.userRepo!,
    credentialsRepo: singletons.credentialsRepo!,
    clock: singletons.clock!,
    ids: singletons.ids!
  };
}