"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_QUANTITY_PER_ITEM,
  addToCartSchema,
  updateQuantitySchema,
} from "./schemas";

export type CartActionResult =
  | { ok?: boolean; error?: string; needsLogin?: boolean }
  | undefined;

const idSchema = z.uuid();
const GENERIC_ERROR = "Something went wrong. Please try again.";
const LOGIN_RESULT = {
  error: "Please sign in to use your cart.",
  needsLogin: true,
} as const;

export async function addToCartAction(
  input: unknown,
): Promise<CartActionResult> {
  const parsed = addToCartSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request." };
  const { variantId, quantity } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return LOGIN_RESULT;

  // الـ RLS بتخفي variants المنتجات غير النشطة، فمش هيلاقيها
  const { data: variant } = await supabase
    .from("product_variants")
    .select("id, stock_quantity")
    .eq("id", variantId)
    .maybeSingle();
  if (!variant) return { error: "This option is no longer available." };
  if (variant.stock_quantity <= 0) return { error: "This option is sold out." };

  const { data: existing } = await supabase
    .from("cart_items")
    .select("quantity")
    .eq("user_id", user.id)
    .eq("variant_id", variantId)
    .maybeSingle();

  const limit = Math.min(MAX_QUANTITY_PER_ITEM, variant.stock_quantity);
  const newQuantity = (existing?.quantity ?? 0) + quantity;

  if (newQuantity > limit) {
    return {
      error:
        existing && existing.quantity >= limit
          ? "You already have the maximum available in your cart."
          : `Only ${limit} available for this option.`,
    };
  }

  const { error } = await supabase
    .from("cart_items")
    .upsert(
      { user_id: user.id, variant_id: variantId, quantity: newQuantity },
      { onConflict: "user_id,variant_id" },
    );
  if (error) return { error: GENERIC_ERROR };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function updateCartQuantityAction(
  input: unknown,
): Promise<CartActionResult> {
  const parsed = updateQuantitySchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid quantity." };
  const { itemId, quantity } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return LOGIN_RESULT;

  const { data: item } = await supabase
    .from("cart_items")
    .select("id, product_variants ( stock_quantity )")
    .eq("id", itemId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!item) return { error: "Cart item not found." };

  const stock = item.product_variants?.stock_quantity ?? 0;
  const limit = Math.min(MAX_QUANTITY_PER_ITEM, stock);
  if (quantity > limit) {
    return { error: `Only ${limit} available for this option.` };
  }

  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .select("id");
  if (error || !data || data.length === 0) return { error: GENERIC_ERROR };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeCartItemAction(
  itemId: unknown,
): Promise<CartActionResult> {
  const parsed = idSchema.safeParse(itemId);
  if (!parsed.success) return { error: GENERIC_ERROR };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return LOGIN_RESULT;

  const { data, error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .select("id");
  if (error || !data || data.length === 0) {
    return { error: "Cart item not found." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}