import { describe, expect, it } from "vitest";
import { couponSchema } from "./schemas";

const base = {
  code: "WELCOME10",
  type: "percent" as const,
  value: "10",
  minOrder: "",
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
};

const issuePaths = (input: unknown) => {
  const result = couponSchema.safeParse(input);
  return result.success ? [] : result.error.issues.map((i) => i.path.join("."));
};

describe("couponSchema", () => {
  it("accepts a minimal percentage coupon", () => {
    expect(couponSchema.safeParse(base).success).toBe(true);
  });

  it("accepts a fixed coupon with every optional field", () => {
    const result = couponSchema.safeParse({
      code: "save_100",
      type: "fixed",
      value: "100.50",
      minOrder: "800",
      startsAt: "2026-11-01",
      expiresAt: "2026-11-30",
      usageLimit: "50",
    });
    expect(result.success).toBe(true);
  });

  it.each(["AB", "HAS SPACE", "bad!", "a".repeat(31), ""])("rejects the code %j", (code) => {
    expect(issuePaths({ ...base, code })).toContain("code");
  });

  it("allows a percentage of exactly 100 but not more", () => {
    expect(couponSchema.safeParse({ ...base, value: "100" }).success).toBe(true);
    expect(issuePaths({ ...base, value: "100.5" })).toContain("value");
    expect(issuePaths({ ...base, value: "150" })).toContain("value");
  });

  it("allows a fixed amount larger than 100", () => {
    expect(couponSchema.safeParse({ ...base, type: "fixed", value: "150" }).success).toBe(true);
  });

  it.each(["0", "0.00", "-5", "abc", ""])("rejects the discount value %j", (value) => {
    expect(issuePaths({ ...base, value })).toContain("value");
  });

  it("rejects an expiry before the start date, and accepts the same day", () => {
    expect(issuePaths({ ...base, startsAt: "2026-11-10", expiresAt: "2026-11-09" })).toContain("expiresAt");
    expect(
      couponSchema.safeParse({ ...base, startsAt: "2026-11-10", expiresAt: "2026-11-10" }).success,
    ).toBe(true);
  });

  it("rejects impossible dates", () => {
    expect(issuePaths({ ...base, startsAt: "2026-02-31" })).toContain("startsAt");
    expect(issuePaths({ ...base, expiresAt: "tomorrow" })).toContain("expiresAt");
  });

  it.each(["0", "-1", "1.5", "abc", "1000000"])("rejects the usage limit %j", (usageLimit) => {
    expect(issuePaths({ ...base, usageLimit })).toContain("usageLimit");
  });

  it("rejects an invalid minimum order", () => {
    expect(issuePaths({ ...base, minOrder: "abc" })).toContain("minOrder");
  });
});