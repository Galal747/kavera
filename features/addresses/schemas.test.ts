import { describe, expect, it } from "vitest";
import { addressSchema } from "./schemas";

const valid = {
  fullName: "Ahmed Hassan",
  phone: "01012345678",
  governorate: "Cairo",
  city: "Nasr City",
  street: "12 Abbas El Akkad St",
  notes: "",
  makeDefault: false,
};

describe("addressSchema", () => {
  it("accepts a valid address", () => {
    expect(addressSchema.safeParse(valid).success).toBe(true);
  });

  it.each(["01012345678", "01112345678", "01212345678", "01512345678"])(
    "accepts the Egyptian mobile number %s",
    (phone) => {
      expect(addressSchema.safeParse({ ...valid, phone }).success).toBe(true);
    },
  );

  it.each([
    ["an unknown prefix", "01312345678"],
    ["too few digits", "0101234567"],
    ["too many digits", "010123456789"],
    ["an international format", "+201012345678"],
    ["a landline", "0212345678"],
    ["arabic-indic digits", "٠١٠١٢٣٤٥٦٧٨"],
    ["letters", "01abc345678"],
    ["spaces inside", "0101 234 5678"],
  ])("rejects a phone number with %s", (_name, phone) => {
    expect(addressSchema.safeParse({ ...valid, phone }).success).toBe(false);
  });

  it("trims whitespace around the phone number", () => {
    const result = addressSchema.safeParse({ ...valid, phone: " 01012345678 " });
    expect(result.success).toBe(true);
  });

  it("rejects a governorate that isn't in the list", () => {
    expect(addressSchema.safeParse({ ...valid, governorate: "Atlantis" }).success).toBe(false);
  });

  it("rejects a very short street and an over-long name", () => {
    expect(addressSchema.safeParse({ ...valid, street: "abc" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...valid, fullName: "a".repeat(81) }).success).toBe(false);
  });
});