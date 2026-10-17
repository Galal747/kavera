"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { productSchema, variantSchema, variantUpdateSchema } from "./schemas";

export type ActionResult = { error?: string; ok?: boolean } | undefined;

const idSchema = z.uuid();
const GENERIC_ERROR = "Something went wrong. Please try again.";

// بعد أي تعديل نحدّث كل الصفحات اللي ممكن تتأثر (المتجر والأدمن)
function refreshEverything() {
  revalidatePath("/", "layout");
}

function toRow(v: z.infer<typeof productSchema>) {
  return {
    name: v.name,
    slug: v.slug,
    description: v.description || null,
    base_price: Number(v.price),
    category_id: v.categoryId,
    is_active: v.isActive,
    is_featured: v.isFeatured,
    is_new: v.isNew,
  };
}

// ---------------- Products ----------------

export async function createProductAction(
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();

  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .insert(toRow(parsed.data))
    .select("id")
    .single();

  if (error || !data) {
    if (error?.code === "23505") {
      return { error: "A product with this slug already exists." };
    }
    return { error: "Could not create the product. Please try again." };
  }

  refreshEverything();
  // نوديه على صفحة التعديل علشان يضيف المقاسات والألوان على طول
  redirect(`/admin/products/${data.id}/edit`);
}

export async function updateProductAction(
  id: unknown,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();

  const idParsed = idSchema.safeParse(id);
  const parsed = productSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) {
    return { error: "Please check the form and try again." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .update(toRow(parsed.data))
    .eq("id", idParsed.data)
    .select("id");

  if (error) {
    if (error.code === "23505") {
      return { error: "A product with this slug already exists." };
    }
    return { error: GENERIC_ERROR };
  }
  // الـ RLS لو منعت التعديل بترجّع صفر صفوف من غير error، فنتأكد
  if (!data || data.length === 0) return { error: "Product not found." };

  refreshEverything();
  return { ok: true };
}

export async function deleteProductAction(id: unknown): Promise<ActionResult> {
  await requireAdmin();

  const idParsed = idSchema.safeParse(id);
  if (!idParsed.success) return { error: GENERIC_ERROR };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .delete()
    .eq("id", idParsed.data)
    .select("id");

  if (error) {
    // 23503 = المنتج مرتبط ببيانات تانية (هيحصل لما يبقى فيه طلبات)
    if (error.code === "23503") {
      return {
        error:
          "This product is linked to existing records and can't be deleted. Hide it instead.",
      };
    }
    return { error: GENERIC_ERROR };
  }
  if (!data || data.length === 0) return { error: "Product not found." };

  refreshEverything();
  redirect("/admin/products");
}

// ---------------- Variants ----------------

export async function addVariantAction(
  productId: unknown,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();

  const pidParsed = idSchema.safeParse(productId);
  const parsed = variantSchema.safeParse(input);
  if (!pidParsed.success || !parsed.success) {
    return { error: "Please check the variant details." };
  }
  const v = parsed.data;

  const supabase = await createClient();
  const [productRes, sizeRes, colorRes] = await Promise.all([
    supabase.from("products").select("slug").eq("id", pidParsed.data).maybeSingle(),
    supabase.from("sizes").select("name").eq("id", v.sizeId).maybeSingle(),
    supabase.from("colors").select("name").eq("id", v.colorId).maybeSingle(),
  ]);

  if (!productRes.data || !sizeRes.data || !colorRes.data) {
    return { error: "Product, size or color not found." };
  }

  const sku = `${productRes.data.slug}-${sizeRes.data.name}-${colorRes.data.name}`
    .toUpperCase()
    .replace(/\s+/g, "-");

  const { error } = await supabase.from("product_variants").insert({
    product_id: pidParsed.data,
    size_id: v.sizeId,
    color_id: v.colorId,
    sku,
    stock_quantity: v.stock,
    price_override: v.priceOverride === "" ? null : Number(v.priceOverride),
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "This size and color already exist for this product." };
    }
    return { error: GENERIC_ERROR };
  }

  refreshEverything();
  return { ok: true };
}

export async function updateVariantAction(
  variantId: unknown,
  input: unknown,
): Promise<ActionResult> {
  await requireAdmin();

  const idParsed = idSchema.safeParse(variantId);
  const parsed = variantUpdateSchema.safeParse(input);
  if (!idParsed.success || !parsed.success) {
    return { error: "Please check the stock and price values." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .update({
      stock_quantity: parsed.data.stock,
      price_override:
        parsed.data.priceOverride === "" ? null : Number(parsed.data.priceOverride),
    })
    .eq("id", idParsed.data)
    .select("id");

  if (error) return { error: GENERIC_ERROR };
  if (!data || data.length === 0) return { error: "Variant not found." };

  refreshEverything();
  return { ok: true };
}

export async function deleteVariantAction(
  variantId: unknown,
): Promise<ActionResult> {
  await requireAdmin();

  const idParsed = idSchema.safeParse(variantId);
  if (!idParsed.success) return { error: GENERIC_ERROR };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_variants")
    .delete()
    .eq("id", idParsed.data)
    .select("id");

  if (error) {
    if (error.code === "23503") {
      return {
        error: "This variant is linked to existing records and can't be deleted.",
      };
    }
    return { error: GENERIC_ERROR };
  }
  if (!data || data.length === 0) return { error: "Variant not found." };

  refreshEverything();
  return { ok: true };
}