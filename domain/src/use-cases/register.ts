import {
  User,
  UserRole,
  type UserRole as UserRoleType,
} from "../entities/user";
import type { UserRepository } from "../services/user-service";
import type { IdGenerator, Clock } from "../services/shared-ports";

type Deps = { repo: UserRepository; clock: Clock; ids: IdGenerator };

export async function createUser(data: {
  data: { name: string; email: string; password: string; role?: UserRoleType };
  deps: Deps;
}): Promise<User> {
  const { repo, clock, ids } = data.deps;
  const userData = data.data;
  validateName(userData.name);
  validatePassword(userData.password);
  const normalizedEmail = normalizeEmail(userData.email);

  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    throw new Error("USER_INVALID_EMAIL");
  }

  const role = userData.role ?? UserRole.USER;
  if (!isValidRole(role)) throw new Error("USER_INVALID_ROLE");

  const existing = await repo.findByEmail(normalizedEmail);
  if (existing) throw new Error("USER_EMAIL_TAKEN");

  const now = clock.now();
  const user: User = {
    id: ids.next(),
    name: userData.name,
    email: normalizedEmail,
    role,
    createdAt: now,
    updatedAt: now,
  };

  await repo.create(user);

  return user;
}

function validateName(name: string) {
  if (name?.trim().length <= 2) {
    throw new Error("USER_INVALID_NAME");
  }
}

function normalizeEmail(email: string): string {
  return email?.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(pw: string) {
  if (!pw || pw.length < 8) throw new Error("USER_INVALID_PASSWORD");
}

function isValidRole(role: unknown): role is UserRoleType {
  return role === "ADMIN" || role === "USER" || role === "ASSISTANT";
}
