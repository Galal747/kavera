import { afterEach, describe, expect, it, vi } from "vitest";
import { mapOrderError } from "./errors";

afterEach(() => vi.restoreAllMocks());

describe("mapOrderError", () => {
  it.each(["coupon_invalid", "coupon_expired", "coupon_exhausted", "coupon_min_order"])(
    "flags %s as a coupon problem",
    (code) => {
      expect(mapOrderError(`P0001: ${code}`).field).toBe("coupon");
    },
  );

  it.each(["cart_empty", "items_unavailable", "cart_changed", "shipping_unavailable", "address_not_found"])(
    "flags %s as a general problem with a readable message",
    (code) => {
      const result = mapOrderError(`error: ${code}`);
      expect(result.field).toBe("general");
      expect(result.error).not.toContain(code);
    },
  );

  it("hides unknown database errors from the user and logs them", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = mapOrderError('relation "orders" does not exist (secret detail)');

    expect(result.error).toBe("Something went wrong. Please try again.");
    expect(result.error).not.toContain("secret detail");
    expect(spy).toHaveBeenCalledOnce();
  });
});