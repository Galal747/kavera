"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getPaymobConfig } from "@/features/payments/config";
import { startCardPayment } from "@/features/payments/server";
import { createClient } from "@/lib/supabase/server";
import { mapOrderError } from "./errors";
import { placeOrderSchema, previewSchema } from "./schemas";
import { withinRateLimit } from "@/lib/rate-limit";

export type Quote = {
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  couponCode: string | null;
};

export type PreviewResult =
  | { quote: Quote }
  | { error: string; field: "coupon" | "general" };

export type PlaceOrderResult =
  | { error: string; needsLogin?: boolean }
  | { paymentUrl: string }
  | undefined;

const quoteSchema = z.object({
  subtotal: z.number(),
  discount: z.number(),
  shipping_fee: z.number(),
  total: z.number(),
  coupon_code: z.string().nullable(),
});

const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function previewOrderAction(
  input: unknown,
): Promise<PreviewResult> {
  const parsed = previewSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request.", field: "general" };

  const supabase = await createClient();
  if (parsed.data.couponCode) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user && !(await withinRateLimit(`coupon:${user.id}`, 15, 60))) {
      return {
        error: "Too many coupon attempts. Please wait a minute and try again.",
        field: "coupon",
      };
    }
  }
  const { data, error } = await supabase.rpc("preview_order", {
    p_address_id: parsed.data.addressId,
    p_coupon_code: parsed.data.couponCode || undefined,
  });
  if (error) return mapOrderError(error.message);

  const quote = quoteSchema.safeParse(data);
  if (!quote.success) return { error: GENERIC_ERROR, field: "general" };

  return {
    quote: {
      subtotal: quote.data.subtotal,
      discount: quote.data.discount,
      shippingFee: quote.data.shipping_fee,
      total: quote.data.total,
      couponCode: quote.data.coupon_code,
    },
  };
}

export async function placeOrderAction(
  input: unknown,
): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request." };
  const { paymentMethod } = parsed.data;

  // الكارت مش متاح من غير إعدادات Paymob، حتى لو حد بعت الطلب بإيده
  if (paymentMethod === "card" && !getPaymobConfig()) {
    return {
      error:
        "Card payment isn't available right now. Please choose cash on delivery.",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Please sign in to place your order.", needsLogin: true };
  }
  // كل طلب بيحجز مخزون، فنحدّ من إغراق الطلبات
  if (!(await withinRateLimit(`order:${user.id}`, 10, 3600))) {
    return {
      error: "Too many orders in a short time. Please try again later.",
    };
  }

  // ونمنع حجز المخزون بطلبات كارت كتير مش مدفوعة
  if (paymentMethod === "card") {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("payment_method", "card")
      .eq("status", "pending")
      .in("payment_status", ["unpaid", "failed"]);
    if ((count ?? 0) >= 3) {
      return {
        error:
          "You already have unpaid card orders. Please complete them first, or choose cash on delivery. Unpaid orders are cancelled automatically after about an hour.",
      };
    }
  }
  const { data: orderId, error } = await supabase.rpc("create_order", {
    p_idempotency_key: parsed.data.idempotencyKey,
    p_address_id: parsed.data.addressId,
    p_coupon_code: parsed.data.couponCode || undefined,
    p_payment_method: paymentMethod,
  });

  if (error) return { error: mapOrderError(error.message).error };
  if (!orderId) return { error: GENERIC_ERROR };

  revalidatePath("/", "layout");

  if (paymentMethod === "card") {
    const payment = await startCardPayment(orderId);
    if ("paymentUrl" in payment) return { paymentUrl: payment.paymentUrl };
    // الطلب اتعمل بس الدفع ما بدأش: نوديه لصفحة الطلب يجرّب تاني من هناك
    redirect(`/account/orders/${orderId}?payment=start_failed`);
  }

  redirect(`/account/orders/${orderId}?placed=1`);
}
