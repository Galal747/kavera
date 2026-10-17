"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { productSchema } from "./schemas";

export type ProductActionResult = { error?: string } | undefined;

export async function createProductAction(
  input: unknown,
): Promise<ProductActionResult> {
  // 1) طبقة الحماية الأولى: لازم يكون أدمن
  await requireAdmin();

  // 2) نتحقق من الداتا في السيرفر، مش بنثق في الفورم
  const parsed = productSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }
  const v = parsed.data;

  // 3) طبقة الحماية التانية: الـ RLS هتتأكد برضه إن المستخدم أدمن
  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    name: v.name,
    slug: v.slug,
    description: v.description || null,
    base_price: Number(v.price),
    category_id: v.categoryId,
    is_active: v.isActive,
    is_featured: v.isFeatured,
    is_new: v.isNew,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "A product with this slug already exists." };
    }
    return { error: "Could not create the product. Please try again." };
  }

  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}