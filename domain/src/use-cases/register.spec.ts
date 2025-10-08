import { describe, expect, test } from "vitest";
import { createUser } from "./register";
import { UserRole, type User } from "../entities/user";
import { type UserRepository } from "../services/user-service";
import type { IdGenerator, Clock } from "../services/shared-ports";

class FakeRepo implements UserRepository {
  constructor(private users: User[] = []) {}
  async findById(): Promise<User | null> {
    return null;
  }
  async findByEmail(email: string) {
    return this.users.find((u) => u.email === email) ?? null;
  }
  async create(user: User) {
    this.users.push(user);
  }
}

const fixedClock: Clock = { now: () => new Date("2025-01-01T10:00:00Z") };
const fixedIds: IdGenerator = { next: () => "fixed-id-123" };

describe("Create User Use Case", () => {
  test("should create a user with valid data", async () => {
    const userData = {
      name: "John Doe",
      email: "john.doe@example.com",
      password: "password123",
      role: UserRole.USER,
    };

    const user = await createUser({
      data: userData,
      deps: {
        repo: new FakeRepo(),
        clock: fixedClock,
        ids: fixedIds,
      },
    });

    expect(user).toMatchObject({
      id: expect.any(String),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  test("creates a user with default role USER and normalized email", async () => {
    const userData = {
      name: "John Doe",
      email: "  JOHN.DOE@example.com ",
      password: "password123",
    };

    const user = await createUser({
      data: userData,
      deps: {
        repo: new FakeRepo(),
        clock: fixedClock,
        ids: fixedIds,
      },
    });

    expect(user).toMatchObject({
      id: expect.any(String),
      name: "John Doe",
      email: "john.doe@example.com",
      role: UserRole.USER,
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  test("creates a user with explicit ADMIN role", async () => {
    const userData = {
      name: "Jane",
      email: "jane@example.com",
      password: "password123",
      role: UserRole.ADMIN,
    };

    const user = await createUser({
      data: userData,
      deps: {
        repo: new FakeRepo(),
        clock: fixedClock,
        ids: fixedIds,
      },
    });

    expect(user.role).toBe(UserRole.ADMIN);
  });

  test("fails when name is empty or spaces only", async () => {
    await expect(
      createUser({
        data: {
          name: "   ",
          email: "a@b.com",
          password: "password123",
        },
        deps: {
          repo: new FakeRepo(),
          clock: fixedClock,
          ids: fixedIds,
        },
      })
    ).rejects.toThrow("USER_INVALID_NAME");
  });

  test("fails when name has less than 2 characters", async () => {
    await expect(
      createUser({
        data: {
          name: "A",
          email: "a@b.com",
          password: "password123",
        },
        deps: {
          repo: new FakeRepo(),
          clock: fixedClock,
          ids: fixedIds,
        },
      })
    ).rejects.toThrow("USER_INVALID_NAME");
  });

  test("fails when emails is invalid format", async () => {
    await expect(
      createUser({
        data: {
          name: "John",
          email: "invalid-email",
          password: "password123",
        },
        deps: {
          repo: new FakeRepo(),
          clock: fixedClock,
          ids: fixedIds,
        },
      })
    ).rejects.toThrow("USER_INVALID_EMAIL");
  });

  test("fails when password is empty or too short (<8)", async () => {
    await expect(
      createUser({
        data: {
          name: "John",
          email: "john@example.com",
          password: "",
        },
        deps: {
          repo: new FakeRepo(),
          clock: fixedClock,
          ids: fixedIds,
        },
      })
    ).rejects.toThrow("USER_INVALID_PASSWORD");

    await expect(
      createUser({
        data: {
          name: "John",
          email: "john@example.com",
          password: "short",
        },
        deps: {
          repo: new FakeRepo(),
          clock: fixedClock,
          ids: fixedIds,
        },
      })
    ).rejects.toThrow("USER_INVALID_PASSWORD");
  });

  test("fails when role is invalid at runtime", async () => {
    const badRole = "GODMODE" as any;
    await expect(
      createUser({
        data: {
          name: "John",
          email: "john@example.com",
          password: "password123",
          role: badRole,
        },
        deps: {
          repo: new FakeRepo(),
          clock: fixedClock,
          ids: fixedIds,
        },
      })
    ).rejects.toThrow("USER_INVALID_ROLE");
  });

  test("fails when email already exists", async () => {
    const repo = new FakeRepo([
      {
        id: "u1",
        name: "Existing",
        email: "existing@example.com",
        role: UserRole.USER,
        createdAt: fixedClock.now(),
        updatedAt: fixedClock.now(),
      },
    ]);

    await expect(
      createUser({
        data: {
          name: "John",
          email: "existing@example.com",
          password: "password123",
          role: UserRole.USER,
        },
        deps: { repo, clock: fixedClock, ids: fixedIds },
      })
    ).rejects.toThrow("USER_EMAIL_TAKEN");
  });

  test("uses injected id and clock, persists via repository", async () => {
    const repo = new FakeRepo();
    const now = new Date("2025-01-01T10:00:00Z");
    const clock: Clock = { now: () => now };
    const ids: IdGenerator = { next: () => "id-xyz" };

    const user = await createUser({
      data: {
        name: "Jane",
        email: "Jane@Example.COM",
        password: "password123",
        role: UserRole.ADMIN,
      },
      deps: { repo, clock, ids },
    });

    expect(user).toMatchObject({
      id: "id-xyz",
      email: "jane@example.com",
      createdAt: now,
      updatedAt: now,
      role: UserRole.ADMIN,
    });
  });
});
