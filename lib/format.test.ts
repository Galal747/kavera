import { describe, expect, it } from "vitest";
import { formatDateTime, formatPrice } from "./format";

describe("formatPrice", () => {
  it("shows the amount in EGP without decimals", () => {
    const text = formatPrice(1450);
    expect(text).toContain("1,450");
    expect(text).toContain("EGP");
    expect(text).not.toContain(".");
  });
});

describe("formatDateTime", () => {
  it("renders in Cairo time, not UTC", () => {
    // 22:00 UTC في الشتا = منتصف الليل بتوقيت القاهرة (اليوم اللي بعده)
    expect(formatDateTime("2026-01-15T22:00:00Z")).toContain("16 Jan 2026");
  });
});