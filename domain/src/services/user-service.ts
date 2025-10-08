import type { User } from "../entities/user";

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<void>;
  findById(id: string): Promise<User | null>;
}

export type CredentialsStatus = "ACTIVE" | "BLOCKED";
export interface CredentialsRecord {
  userId: string;
  email: string;
  passwordHash: string;
  status: CredentialsStatus;
}

export interface CredentialsRepository {
  findByEmail(email: string): Promise<CredentialsRecord | null>;
}

export interface PasswordVerifier {
  compare(plain: string, hash: string): Promise<boolean>;
}
