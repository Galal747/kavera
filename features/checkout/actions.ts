"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { mapOrderError } from "./errors";
import { placeOrderSchema, previewSchema } from "./schemas";

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
  | undefined;

// الرد بتاع الـ database: نتحقق من شكله بدل ما نصدّقه
const quoteSchema = z.object({
  subtotal: z.number(),
  discount: z.number(),
  shipping_fee: z.number(),
  total: z.number(),
  coupon_code: z.string().nullable(),
});

const GENERIC_ERROR = "Something went wrong. Please try again.";

// معاينة الحساب. مفيش فيها كتابة، والـ DB هي اللي بتحسب.
export async function previewOrderAction(
  input: unknown,
): Promise<PreviewResult> {
  const parsed = previewSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request.", field: "general" };

  const supabase = await createClient();
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

// إنشاء الطلب. بنبعت: عنوان، كوبون، طريقة دفع، ومفتاح منع التكرار. مفيش أي رقم.
export async function placeOrderAction(
  input: unknown,
): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Please sign in to place your order.", needsLogin: true };
  }

  const { data: orderId, error } = await supabase.rpc("create_order", {
    p_idempotency_key: parsed.data.idempotencyKey,
    p_address_id: parsed.data.addressId,
    p_coupon_code: parsed.data.couponCode || undefined,
    p_payment_method: parsed.data.paymentMethod,
  });

  if (error) return { error: mapOrderError(error.message).error };
  if (!orderId) return { error: GENERIC_ERROR };

  revalidatePath("/", "layout");
  // redirect بترمي exception داخلي، فمتتحطش جوه try/catch
  redirect(`/account/orders/${orderId}?placed=1`);
}