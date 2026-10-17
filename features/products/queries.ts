import type { QueryData, SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { Product, ProductCategory } from "@/types/product";

// ---------- شكل الـ query ----------
// بنجيب المنتج + تصنيفه + الـ variants (بمقاساتها وألوانها) في طلب واحد.
// categories!inner معناها: المنتج لازم يكون له تصنيف (وبتسمح لنا نفلتر بيه).
const PRODUCT_SELECT = `
  id, slug, name, description, base_price, is_new, created_at,
  categories!inner ( slug ),
  product_variants (
    stock_quantity,
    sizes ( name, sort_order ),
    colors ( hex )
  )
`;

function baseQuery(supabase: SupabaseClient<Database>) {
  return supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" });
}

type ProductRow = QueryData<ReturnType<typeof baseQuery>>[number];

// ---------- تحويل صف الـ DB لـ Product اللي الـ UI فاهمه ----------
function toProduct(row: ProductRow): Product {
  const variants = row.product_variants;

  const sizeOrder = new Map<string, number>();
  for (const v of variants) {
    sizeOrder.set(v.sizes.name, v.sizes.sort_order);
  }
  const sizes = [...sizeOrder.entries()]
    .sort((a, b) => a[1] - b[1])
    .map(([name]) => name);

  const colors = [...new Set(variants.map((v) => v.colors.hex))];

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.categories.slug as ProductCategory,
    price: Number(row.base_price),
    isNew: row.is_new,
    inStock: variants.some((v) => v.stock_quantity > 0),
    colors,
    sizes,
  };
}

// ---------- الدوال المستخدمة في الصفحات ----------

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await createClient();
  const { data, error } = await baseQuery(supabase)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? toProduct(data) : null;
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await baseQuery(supabase)
    .eq("categories.slug", product.category)
    .neq("id", product.id)
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map(toProduct);
}

export async function getNewArrivals(limit = 4): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await baseQuery(supabase)
    .eq("is_new", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map(toProduct);
}

// مؤقتًا: المنتجات المميزة. لما نعمل الطلبات هنحسبها من المبيعات الفعلية.
export async function getBestSellers(limit = 4): Promise<Product[]> {
  const supabase = await createClient();
  const { data, error } = await baseQuery(supabase)
    .eq("is_featured", true)
    .limit(limit);

  if (error) throw new Error(error.message);
  return (data ?? []).map(toProduct);
}

export type SortOption = "newest" | "price-asc" | "price-desc" | "name";

export type GetProductsParams = {
  category?: ProductCategory;
  q?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
};

export type PaginatedProducts = {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
};

export async function getProducts({
  category,
  q,
  sort = "newest",
  page = 1,
  pageSize = 12,
}: GetProductsParams): Promise<PaginatedProducts> {
  const supabase = await createClient();
  let query = baseQuery(supabase);

  if (category) {
    query = query.eq("categories.slug", category);
  }

  if (q) {
    // نعمل escape لرموز البحث الخاصة، عشان المستخدم يبحث عن النص زي ما كتبه
    const term = q.replace(/[\\%_]/g, "\\$&");
    query = query.ilike("name", `%${term}%`);
  }

  switch (sort) {
    case "price-asc":
      query = query.order("base_price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("base_price", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query
        .order("is_new", { ascending: false })
        .order("created_at", { ascending: false });
  }
  // ترتيب ثابت للمتساويين، عشان الـ pagination ما تكررش منتجات
  query = query.order("id", { ascending: true });

  const from = (page - 1) * pageSize;
  const { data, count, error } = await query.range(from, from + pageSize - 1);

  if (error) {
    // PGRST103 = طلبنا صفحة أكبر من آخر صفحة. نرجّع الصفحة الأولى.
    if (error.code === "PGRST103" && page > 1) {
      return getProducts({ category, q, sort, page: 1, pageSize });
    }
    throw new Error(error.message);
  }

  const total = count ?? 0;

  return {
    items: (data ?? []).map(toProduct),
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}