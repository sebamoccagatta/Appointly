import type { Clock, IdGenerator } from 'domain/dist/services/shared-ports.js';
import type { UserRepository, CredentialsRepository } from 'domain/dist/services/user-service.js';
import { PrismaUserRepository } from 'src/infra/repositories/prisma/user-repo.js';
import { PrismaCredentialsRepository } from 'src/infra/repositories/prisma/credentials-repo.js';
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