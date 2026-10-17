import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

// الحقول اللي بنحتاجها من الـ webhook (Transaction Processed). أي حاجة ناقصة = رفض.
const transactionSchema = z.object({
  id: z.number(),
  pending: z.boolean(),
  amount_cents: z.number(),
  success: z.boolean(),
  is_auth: z.boolean(),
  is_capture: z.boolean(),
  is_standalone_payment: z.boolean(),
  is_voided: z.boolean(),
  is_refunded: z.boolean(),
  is_3d_secure: z.boolean(),
  integration_id: z.number(),
  has_parent_transaction: z.boolean(),
  created_at: z.string(),
  currency: z.string(),
  error_occured: z.boolean(),
  owner: z.number(),
  order: z.object({ id: z.number() }),
  source_data: z.object({
    pan: z.string(),
    sub_type: z.string(),
    type: z.string(),
  }),
});

export const processedCallbackSchema = z.object({
  type: z.string(),
  obj: transactionSchema,
});

export type PaymobTransaction = z.infer<typeof transactionSchema>;

// ترتيب الحقول زي ما هو في الـ docs الرسمية. أي تغيير هنا بيبوّظ التحقق.
function hmacString(t: PaymobTransaction): string {
  return [
    t.amount_cents,
    t.created_at,
    t.currency,
    t.error_occured,
    t.has_parent_transaction,
    t.id,
    t.integration_id,
    t.is_3d_secure,
    t.is_auth,
    t.is_capture,
    t.is_refunded,
    t.is_standalone_payment,
    t.is_voided,
    t.order.id,
    t.owner,
    t.pending,
    t.source_data.pan,
    t.source_data.sub_type,
    t.source_data.type,
    t.success,
  ]
    .map(String)
    .join("");
}

export function verifyPaymobHmac(
  t: PaymobTransaction,
  receivedHmac: string,
  secret: string,
): boolean {
  const expected = createHmac("sha512", secret).update(hmacString(t)).digest();

  // الـ hex لازم يكون بالطول المظبوط، وبنقارن بطريقة ثابتة الوقت
  if (!/^[0-9a-fA-F]{128}$/.test(receivedHmac)) return false;
  const received = Buffer.from(receivedHmac, "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

export type PaymentOutcome = "paid" | "failed" | "pending" | "ignored";

export function classifyTransaction(t: PaymobTransaction): PaymentOutcome {
  // إحنا بندعم دفعة كارت عادية بس. استرداد/إلغاء (void)/authorize/capture
  // بيجوا بنفس شكل الـ callback وبعضهم success=true، فلازم نتجاهلهم
  // عشان ما نعتبرهم دفعة جديدة.
  if (
    !t.is_standalone_payment ||
    t.is_auth ||
    t.is_capture ||
    t.is_voided ||
    t.is_refunded ||
    t.has_parent_transaction
  ) {
    return "ignored";
  }
  if (t.pending) return "pending";
  if (t.success && !t.error_occured) return "paid";
  return "failed";
}

// ملخص صغير للتخزين. مش بنخزّن الـ payload كامل (فيه بيانات شخصية).
export function summarizeTransaction(t: PaymobTransaction) {
  return {
    transaction_id: t.id,
    order_id: t.order.id,
    amount_cents: t.amount_cents,
    currency: t.currency,
    success: t.success,
    pending: t.pending,
    error_occured: t.error_occured,
    card_brand: t.source_data.sub_type,
    card_last4: t.source_data.pan,
    created_at: t.created_at,
  };
}