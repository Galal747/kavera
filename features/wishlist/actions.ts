"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type WishlistActionResult =
  | { ok?: boolean; error?: string; needsLogin?: boolean }
  | undefined;

const inputSchema = z.object({
  productId: z.uuid(),
  wished: z.boolean(),
});

const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function setWishlistAction(
  input: unknown,
): Promise<WishlistActionResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { error: "Invalid request." };
  const { productId, wished } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "Please sign in to use your wishlist.", needsLogin: true };
  }

  if (wished) {
    // الـ foreign key مابتتأثرش بالـ RLS، فنتأكد بنفسنا إن المنتج ظاهر وفعّال
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .maybeSingle();
    if (!product) return { error: "This product is no longer available." };

    const { error } = await supabase
      .from("wishlist_items")
      .upsert(
        { user_id: user.id, product_id: productId },
        { onConflict: "user_id,product_id", ignoreDuplicates: true },
      );
    if (error) return { error: GENERIC_ERROR };
  } else {
    const { error } = await supabase
      .from("wishlist_items")
      .delete()
      .eq("user_id", user.id)
      .eq("product_id", productId);
    if (error) return { error: GENERIC_ERROR };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}