import { describe, expect, it } from "vitest";
import { slugify } from "./slug";

describe("slugify", () => {
  it("lowercases and joins words with dashes", () => {
    expect(slugify("Cairo Oversized Tee")).toBe("cairo-oversized-tee");
  });

  it("removes punctuation and trims dashes", () => {
    expect(slugify("  --Nile Heavy Hoodie!!  ")).toBe("nile-heavy-hoodie");
  });

  it("collapses repeated separators", () => {
    expect(slugify("a   &   b")).toBe("a-b");
  });

  // محدودية معروفة: الاسم العربي بيطلع slug فاضي، والأدمن لازم يكتبه بإيده
  it("returns an empty string for names without latin letters or digits", () => {
    expect(slugify("تيشيرت القاهرة")).toBe("");
  });
});