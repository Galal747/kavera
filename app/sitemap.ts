import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { PRODUCT_CATEGORIES } from "@/types/product";

// يتحدّث كل ساعة
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");

  const pages: Entry[] = [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/shop`, changeFrequency: "daily", priority: 0.9 },
    ...PRODUCT_CATEGORIES.map(
      (category): Entry => ({
        url: `${base}/shop?category=${category}`,
        changeFrequency: "weekly",
        priority: 0.7,
      }),
    ),
  ];

  // لو الـ database مش متاحة وقت الـ build، الـ sitemap يفضل شغال بالصفحات الثابتة
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("products")
      .select("slug, updated_at")
      .order("updated_at", { ascending: false })
      .limit(5000);
    if (error) throw error;

    return [
      ...pages,
      ...(data ?? []).map(
        (product): Entry => ({
          url: `${base}/product/${product.slug}`,
          lastModified: product.updated_at,
          changeFrequency: "weekly",
          priority: 0.8,
        }),
      ),
    ];
  } catch (err) {
    console.error("[sitemap] could not load products:", err);
    return pages;
  }
}