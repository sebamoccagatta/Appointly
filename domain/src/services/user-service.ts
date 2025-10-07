import type { User } from "../entities/user";

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<void>;
}

export interface IdGenerator {
  next(): string;
}

export interface Clock {
  now(): Date;
}
