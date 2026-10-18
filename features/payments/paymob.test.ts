import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  classifyTransaction,
  processedCallbackSchema,
  summarizeTransaction,
  verifyPaymobHmac,
  type PaymobTransaction,
} from "./paymob";

const SECRET = "unit-test-secret";

// العينة الرسمية من docs بتاعة Paymob
const sample: PaymobTransaction = {
  id: 192036465,
  pending: false,
  amount_cents: 100000,
  success: true,
  is_auth: false,
  is_capture: false,
  is_standalone_payment: true,
  is_voided: false,
  is_refunded: false,
  is_3d_secure: true,
  integration_id: 4097558,
  has_parent_transaction: false,
  created_at: "2024-06-13T11:33:44.592345",
  currency: "EGP",
  error_occured: false,
  owner: 302852,
  order: { id: 217503754 },
  source_data: { pan: "2346", sub_type: "MasterCard", type: "card" },
};

// السلسلة اللي الـ docs بتقول إن الـ HMAC بيتحسب عليها لنفس العينة.
// مكتوبة يدويًا هنا (مش متحسبة من الكود)، فلو حد غيّر ترتيب الحقول الاختبار يفشل.
const DOCS_CONCATENATION =
  "1000002024-06-13T11:33:44.592345EGPfalsefalse1920364654097558truefalsefalsefalsetruefalse217503754302852false2346MasterCardcardtrue";

const sign = (message: string, secret = SECRET) =>
  createHmac("sha512", secret).update(message).digest("hex");

describe("verifyPaymobHmac", () => {
  it("accepts the signature computed from the documented field order", () => {
    expect(verifyPaymobHmac(sample, sign(DOCS_CONCATENATION), SECRET)).toBe(true);
  });

  it("accepts an uppercase hex signature", () => {
    expect(
      verifyPaymobHmac(sample, sign(DOCS_CONCATENATION).toUpperCase(), SECRET),
    ).toBe(true);
  });

  it("rejects a signature made with a different secret", () => {
    expect(
      verifyPaymobHmac(sample, sign(DOCS_CONCATENATION, "other-secret"), SECRET),
    ).toBe(false);
  });

  it.each<[string, Partial<PaymobTransaction>]>([
    ["the amount", { amount_cents: 1 }],
    ["the success flag", { success: false }],
    ["the transaction id", { id: 1 }],
    ["the order id", { order: { id: 1 } }],
    ["the currency", { currency: "USD" }],
    ["the pending flag", { pending: true }],
    ["the refunded flag", { is_refunded: true }],
  ])("rejects a payload where %s was changed after signing", (_name, change) => {
    const signature = sign(DOCS_CONCATENATION);
    expect(verifyPaymobHmac({ ...sample, ...change }, signature, SECRET)).toBe(false);
  });

  it.each([
    ["an empty value", ""],
    ["a too-short value", "abc123"],
    ["a non-hex value", "z".repeat(128)],
    ["a value that is too long", "a".repeat(130)],
  ])("rejects %s", (_name, value) => {
    expect(verifyPaymobHmac(sample, value, SECRET)).toBe(false);
  });
});

describe("classifyTransaction", () => {
  it("treats a successful standalone card payment as paid", () => {
    expect(classifyTransaction(sample)).toBe("paid");
  });

  it("treats an unsuccessful payment as failed", () => {
    expect(classifyTransaction({ ...sample, success: false })).toBe("failed");
  });

  it("treats a success flag with an error as failed", () => {
    expect(classifyTransaction({ ...sample, error_occured: true })).toBe("failed");
  });

  it("treats a pending transaction as pending, even if success is true", () => {
    expect(classifyTransaction({ ...sample, pending: true })).toBe("pending");
  });

  // دول بييجوا بـ success=true، فلو اتحسبوا دفعة هنعتبر الاسترداد دفع جديد
  it.each<[string, Partial<PaymobTransaction>]>([
    ["refund", { is_refunded: true }],
    ["void", { is_voided: true }],
    ["authorize only", { is_auth: true }],
    ["capture", { is_capture: true }],
    ["transaction with a parent", { has_parent_transaction: true }],
    ["non-standalone payment", { is_standalone_payment: false }],
  ])("ignores a successful %s", (_name, change) => {
    expect(classifyTransaction({ ...sample, ...change })).toBe("ignored");
  });
});

describe("processedCallbackSchema", () => {
  it("accepts a well-formed callback", () => {
    expect(
      processedCallbackSchema.safeParse({ type: "TRANSACTION", obj: sample }).success,
    ).toBe(true);
  });

  it("rejects a callback with a missing field", () => {
    const incomplete: Record<string, unknown> = { ...sample };
    delete incomplete.amount_cents;
    expect(
      processedCallbackSchema.safeParse({ type: "TRANSACTION", obj: incomplete }).success,
    ).toBe(false);
  });

  it("rejects a callback where a boolean arrives as a string", () => {
    expect(
      processedCallbackSchema.safeParse({
        type: "TRANSACTION",
        obj: { ...sample, success: "true" },
      }).success,
    ).toBe(false);
  });
});

describe("summarizeTransaction", () => {
  it("keeps only a small, non-personal summary", () => {
    expect(Object.keys(summarizeTransaction(sample)).sort()).toEqual(
      [
        "amount_cents",
        "card_brand",
        "card_last4",
        "created_at",
        "currency",
        "error_occured",
        "order_id",
        "pending",
        "success",
        "transaction_id",
      ].sort(),
    );
  });
});