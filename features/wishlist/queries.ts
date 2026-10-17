import { getProductsByIds } from "@/features/products/queries";
import { createClient } from "@/lib/supabase/server";
import type { Product } from "@/types/product";

// IDs المنتجات في مفضلة المستخدم الحالي (فاضية لو مش مسجّل)
export async function getWishlistProductIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data, error } = await supabase
    .from("wishlist_items")
    .select("product_id");
  if (error) throw new Error(error.message);

  return new Set((data ?? []).map((row) => row.product_id));
}

// منتجات المفضلة، الأحدث إضافة الأول
export async function getWishlistProducts(): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("product_id")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  return getProductsByIds((data ?? []).map((row) => row.product_id));
}