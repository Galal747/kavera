import { describe, expect, it } from "vitest";
import { productSchema, variantSchema, variantUpdateSchema } from "./schemas";

const uuid = "123e4567-e89b-42d3-a456-426614174000";

const product = {
  name: "Cairo Oversized Tee",
  slug: "cairo-oversized-tee",
  description: "",
  price: "650",
  categoryId: uuid,
  isActive: true,
  isFeatured: false,
  isNew: true,
};

describe("productSchema", () => {
  it("accepts a valid product", () => {
    expect(productSchema.safeParse(product).success).toBe(true);
  });

  it.each(["650", "650.5", "650.50", "1", "9999999"])("accepts the price %s", (price) => {
    expect(productSchema.safeParse({ ...product, price }).success).toBe(true);
  });

  it.each([
    ["zero", "0"],
    ["zero with decimals", "0.00"],
    ["negative", "-5"],
    ["letters", "abc"],
    ["three decimals", "650.555"],
    ["too many digits", "10000000"],
    ["a comma decimal", "650,5"],
    ["empty", ""],
  ])("rejects a price that is %s", (_name, price) => {
    expect(productSchema.safeParse({ ...product, price }).success).toBe(false);
  });

  it.each(["Hello World", "-leading", "trailing-", "double--dash", "UPPER", "with_underscore", "تيشيرت"])(
    "rejects the slug %s",
    (slug) => {
      expect(productSchema.safeParse({ ...product, slug }).success).toBe(false);
    },
  );

  it("requires a real category id", () => {
    expect(productSchema.safeParse({ ...product, categoryId: "" }).success).toBe(false);
    expect(productSchema.safeParse({ ...product, categoryId: "not-a-uuid" }).success).toBe(false);
  });

  it("rejects an over-long description", () => {
    expect(productSchema.safeParse({ ...product, description: "a".repeat(2001) }).success).toBe(false);
  });
});

describe("variantSchema", () => {
  const variant = { sizeId: uuid, colorId: uuid, stock: 10, priceOverride: "" };

  it("accepts a valid variant, with or without a price override", () => {
    expect(variantSchema.safeParse(variant).success).toBe(true);
    expect(variantSchema.safeParse({ ...variant, priceOverride: "700" }).success).toBe(true);
  });

  it.each([
    ["negative", -1],
    ["a fraction", 1.5],
    ["too large", 100001],
    ["not a number", Number.NaN],
  ])("rejects stock that is %s", (_name, stock) => {
    expect(variantSchema.safeParse({ ...variant, stock }).success).toBe(false);
  });

  it("accepts zero stock (sold out)", () => {
    expect(variantSchema.safeParse({ ...variant, stock: 0 }).success).toBe(true);
  });

  it.each(["0", "-5", "abc", "700.999"])("rejects the price override %s", (priceOverride) => {
    expect(variantSchema.safeParse({ ...variant, priceOverride }).success).toBe(false);
  });

  it("validates updates with only stock and price override", () => {
    expect(variantUpdateSchema.safeParse({ stock: 3, priceOverride: "" }).success).toBe(true);
    expect(variantUpdateSchema.safeParse({ stock: -3, priceOverride: "" }).success).toBe(false);
  });
});