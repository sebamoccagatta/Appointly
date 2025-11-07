import type {
  CredentialsRepository,
  PasswordVerifier,
  UserRepository,
} from "../services/user-service.js";
import type { UserRole } from "../entities/user.js";

export interface AuthResult {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

function normalizeEmail(email: string): string {
  return email?.trim().toLowerCase();
}
function isValidEmail(email: string): boolean {
  // Regex simple y suficiente para dominio
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function authenticateUser(args: {
  data: { email: string; password: string };
  deps: {
    credsRepo: CredentialsRepository;
    usersRepo: UserRepository;
    passwordVerifier: PasswordVerifier;
  };
}): Promise<AuthResult> {
  const { email, password } = args.data;
  const { credsRepo, usersRepo, passwordVerifier } = args.deps;

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail || !isValidEmail(normalizedEmail)) {
    throw new Error("USER_INVALID_EMAIL");
  }

  const creds = await credsRepo.findByEmail(normalizedEmail);
  if (!creds) throw new Error("AUTH_INVALID_CREDENTIALS");
  if (creds.status !== "ACTIVE") throw new Error("USER_BLOCKED");

  const ok = await passwordVerifier.compare(password, creds.passwordHash);
  if (!ok) throw new Error("AUTH_INVALID_CREDENTIALS");

  const user = await usersRepo.findById(creds.userId);
  if (!user) throw new Error("AUTH_INVALID_CREDENTIALS"); // inconsistencia defensiva

  return {
    userId: user.id,
    email: user.email, // ya normalizado en registro
    name: user.name,
    role: user.role,
  };
}
