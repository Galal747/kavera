import Link from "next/link";
import { z } from "zod";
import { Pagination } from "@/features/products/components/pagination";
import { ProductCard } from "@/features/products/components/product-card";
import { ShopControls } from "@/features/products/components/shop-controls";
import { getProducts } from "@/features/products/queries";
import { PRODUCT_CATEGORIES } from "@/types/product";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import { FadeIn } from "@/components/shared/fade-in";

// الـ URL مدخل من المستخدم، فنتحقق منه دايمًا. أي قيمة غلط ترجع للافتراضي.
const searchSchema = z.object({
  category: z.enum(PRODUCT_CATEGORIES).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
  sort: z
    .enum(["newest", "price-asc", "price-desc", "name"])
    .catch("newest"),
  page: z.coerce.number().int().min(1).catch(1),
});

type ShopPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const filters = searchSchema.parse(await searchParams);
  const { items, total, page, totalPages } = await getProducts(filters);
  const wishlistIds = await getWishlistProductIds();
  
  function buildHref(targetPage: number) {
    const params = new URLSearchParams();
    if (filters.category) params.set("category", filters.category);
    if (filters.q) params.set("q", filters.q);
    if (filters.sort !== "newest") params.set("sort", filters.sort);
    if (targetPage > 1) params.set("page", String(targetPage));
    const qs = params.toString();
    return qs ? `/shop?${qs}` : "/shop";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <FadeIn>
        <h1 className="font-[family-name:var(--font-display)] text-4xl uppercase tracking-tight">
          {filters.category ?? "All products"}
        </h1>
        <p className="mb-6 mt-2 text-sm text-neutral-600">
          {total} {total === 1 ? "item" : "items"}
          {filters.q ? ` for “${filters.q}”` : ""}
        </p>
      </FadeIn>

      <FadeIn delay={0.1}>
        <ShopControls />
      </FadeIn>

      {items.length === 0 ? (
        <FadeIn delay={0.2}>
          <div className="mt-16 text-center">
            <p className="text-neutral-500">No products match your search.</p>
            <Link
              href="/shop"
              className="mt-3 inline-block text-sm underline underline-offset-4 transition-colors hover:text-neutral-900"
            >
              Clear filters
            </Link>
          </div>
        </FadeIn>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {items.map((product, i) => (
              <FadeIn key={product.id} delay={0.15 + i * 0.05}>
                <ProductCard
                  product={product}
                  wished={wishlistIds.has(product.id)}
                />
              </FadeIn>
            ))}
          </div>
          
          <FadeIn delay={0.3}>
            <div className="mt-12">
              <Pagination
                page={page}
                totalPages={totalPages}
                buildHref={buildHref}
              />
            </div>
          </FadeIn>
        </>
      )}
    </div>
  );
}