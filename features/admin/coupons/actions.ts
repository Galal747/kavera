"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { cairoDateToIso } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { couponSchema } from "./schemas";

export type CouponActionResult = { ok?: boolean; error?: string } | undefined;

const idSchema = z.uuid();
const GENERIC_ERROR = "Something went wrong. Please try again.";

export async function createCouponAction(
  input: unknown,
): Promise<CouponActionResult> {
  await requireAdmin();

  const parsed = couponSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }
  const v = parsed.data;

  // الـ RLS (policy الأدمن) هي الطبقة التانية: لو مش أدمن الـ insert بيترفض
  const supabase = await createClient();
  const { error } = await supabase.from("coupons").insert({
    code: v.code.toUpperCase(),
    type: v.type,
    value: Number(v.value),
    min_order: v.minOrder === "" ? 0 : Number(v.minOrder),
    starts_at: v.startsAt ? cairoDateToIso(v.startsAt, false) : null,
    expires_at: v.expiresAt ? cairoDateToIso(v.expiresAt, true) : null,
    usage_limit: v.usageLimit === "" ? null : Number(v.usageLimit),
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A coupon with this code already exists." };
    }
    return { error: GENERIC_ERROR };
  }

  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function setCouponActiveAction(
  couponId: unknown,
  active: unknown,
): Promise<CouponActionResult> {
  await requireAdmin();

  const id = idSchema.safeParse(couponId);
  const flag = z.boolean().safeParse(active);
  if (!id.success || !flag.success) return { error: GENERIC_ERROR };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .update({ is_active: flag.data })
    .eq("id", id.data)
    .select("id");
  if (error) return { error: GENERIC_ERROR };
  if (!data || data.length === 0) return { error: "Coupon not found." };

  revalidatePath("/admin/coupons");
  return { ok: true };
}

export async function deleteCouponAction(
  couponId: unknown,
): Promise<CouponActionResult> {
  await requireAdmin();

  const id = idSchema.safeParse(couponId);
  if (!id.success) return { error: GENERIC_ERROR };

  // الشرط used_count = 0 جوه نفس الـ delete، فمفيش فرصة إن كوبون يتستخدم بين الفحص والمسح
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", id.data)
    .eq("used_count", 0)
    .select("id");
  if (error) return { error: GENERIC_ERROR };
  if (!data || data.length === 0) {
    return {
      error:
        "Coupon not found, or it has already been used. Deactivate it instead of deleting it.",
    };
  }

  revalidatePath("/admin/coupons");
  return { ok: true };
}