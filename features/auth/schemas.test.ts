import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./schemas";

const register = {
  fullName: "Galal Samy",
  email: "user@example.com",
  password: "correct-horse",
  confirmPassword: "correct-horse",
};

describe("registerSchema", () => {
  it("accepts valid registration data", () => {
    expect(registerSchema.safeParse(register).success).toBe(true);
  });

  it("reports mismatching passwords on the confirm field", () => {
    const result = registerSchema.safeParse({ ...register, confirmPassword: "different-one" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["confirmPassword"]);
    }
  });

  it("enforces the password length limits (8 to 72)", () => {
    expect(registerSchema.safeParse({ ...register, password: "short", confirmPassword: "short" }).success).toBe(false);
    const long = "a".repeat(73);
    expect(registerSchema.safeParse({ ...register, password: long, confirmPassword: long }).success).toBe(false);
    const edge = "a".repeat(72);
    expect(registerSchema.safeParse({ ...register, password: edge, confirmPassword: edge }).success).toBe(true);
  });

  it.each(["", "not-an-email", "a@", "@b.com", "a b@c.com"])("rejects the email %j", (email) => {
    expect(registerSchema.safeParse({ ...register, email }).success).toBe(false);
  });

  it("rejects a one-letter name", () => {
    expect(registerSchema.safeParse({ ...register, fullName: "A" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts any non-empty password (strength is checked at registration)", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "x" }).success).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "user@example.com", password: "" }).success).toBe(false);
  });
});