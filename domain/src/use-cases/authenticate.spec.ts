import { describe, expect, test } from "vitest";
import { authenticateUser } from "./authenticate";
import { UserRole, type User } from "../entities/user";
import type {
  CredentialsRepository,
  CredentialsRecord,
  PasswordVerifier,
  UserRepository,
} from "../services/user-service";

class FakeCredentialsRepo implements CredentialsRepository {
  constructor(private rows: CredentialsRecord[] = []) {}
  async findByEmail(email: string) {
    return this.rows.find((r) => r.email === email) ?? null;
  }
  async create(_rec: CredentialsRecord) {
    /* no-op */
  }
}

class FakeUsersRepo implements UserRepository {
  constructor(private rows: User[] = []) {}
  async findByEmail(email: string) {
    return this.rows.find((u) => u.email === email) ?? null;
  }
  async create(_user: User) {
    /* no-op */
  }
  async findById(id: string) {
    return this.rows.find((u) => u.id === id) ?? null;
  }
}

class FakePasswordVerifier implements PasswordVerifier {
  async compare(plain: string, _hash: string) {
    // Para el test feliz, consideramos válida la contraseña 'secret'
    return plain === "secret";
  }
}

class WrongPasswordVerifier implements PasswordVerifier {
  async compare() {
    return false;
  }
}

describe("Authenticate User Use Case", () => {
  test("authenticates with valid email/password and returns user info", async () => {
    const users: User[] = [
      {
        id: "u1",
        name: "Jane",
        email: "jane@example.com",
        role: UserRole.ADMIN,
        createdAt: new Date("2025-01-01T10:00:00Z"),
        updatedAt: new Date("2025-01-01T10:00:00Z"),
      },
    ];

    const creds: CredentialsRecord[] = [
      {
        userId: "u1",
        email: "jane@example.com", // IMPORTANTE: normalizado
        passwordHash: "hash:secret", // el fake no lo usa realmente
        status: "ACTIVE",
      },
    ];

    const credsRepo = new FakeCredentialsRepo(creds);
    const usersRepo = new FakeUsersRepo(users);
    const passwordVerifier = new FakePasswordVerifier();

    const result = await authenticateUser({
      data: { email: "  JANE@EXAMPLE.COM  ", password: "secret" },
      deps: { credsRepo, usersRepo, passwordVerifier },
    });

    expect(result).toMatchObject({
      userId: "u1",
      email: "jane@example.com",
      name: "Jane",
      role: UserRole.ADMIN,
    });
  });

  test("fails when email is invalid", async () => {
    const credsRepo = new FakeCredentialsRepo();
    const usersRepo = new FakeUsersRepo();
    const passwordVerifier = new FakePasswordVerifier();

    await expect(
      authenticateUser({
        data: { email: "not-an-email", password: "secret" },
        deps: { credsRepo, usersRepo, passwordVerifier },
      })
    ).rejects.toThrow("USER_INVALID_EMAIL");
  });

  test("fails when user does not exist (credentials not found)", async () => {
    const credsRepo = new FakeCredentialsRepo([]); // vacío
    const usersRepo = new FakeUsersRepo([]);
    const passwordVerifier = new FakePasswordVerifier();

    await expect(
      authenticateUser({
        data: { email: "ghost@example.com", password: "secret" },
        deps: { credsRepo, usersRepo, passwordVerifier },
      })
    ).rejects.toThrow("AUTH_INVALID_CREDENTIALS");
  });

  test("fails when password is incorrect", async () => {
    const credsRepo = new FakeCredentialsRepo([
      {
        userId: "u1",
        email: "jane@example.com",
        passwordHash: "hash:secret",
        status: "ACTIVE",
      },
    ]);
    const usersRepo = new FakeUsersRepo([
      {
        id: "u1",
        name: "Jane",
        email: "jane@example.com",
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const passwordVerifier = new WrongPasswordVerifier();

    await expect(
      authenticateUser({
        data: { email: "jane@example.com", password: "wrong" },
        deps: { credsRepo, usersRepo, passwordVerifier },
      })
    ).rejects.toThrow("AUTH_INVALID_CREDENTIALS");
  });

  test("fails when user is blocked", async () => {
    const credsRepo = new FakeCredentialsRepo([
      {
        userId: "u1",
        email: "jane@example.com",
        passwordHash: "hash:secret",
        status: "BLOCKED",
      },
    ]);
    const usersRepo = new FakeUsersRepo([
      {
        id: "u1",
        name: "Jane",
        email: "jane@example.com",
        role: UserRole.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const passwordVerifier = new FakePasswordVerifier();

    await expect(
      authenticateUser({
        data: { email: "jane@example.com", password: "secret" },
        deps: { credsRepo, usersRepo, passwordVerifier },
      })
    ).rejects.toThrow("USER_BLOCKED");
  });
});
