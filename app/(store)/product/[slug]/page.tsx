import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/features/products/components/product-card";
import { VariantSelector } from "@/features/products/components/variant-selector";
import { ProductGallery } from "@/features/products/components/product-gallery";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/features/products/queries";
import { formatPrice } from "@/lib/format";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import { FadeIn } from "@/components/shared/fade-in";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  
  if (!product) return { title: "Not found" };

  return {
    title: product ? product.name : "Not found",
    description: product.description ?? undefined,
    openGraph: product.images[0] ? { images: [product.images[0]] } : undefined,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const [related, wishlistIds] = await Promise.all([
    getRelatedProducts(product),
    getWishlistProductIds(),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        {/* معرض الصور بيظهر الأول */}
        <FadeIn delay={0.1}>
          <ProductGallery images={product.images} />
        </FadeIn>

        {/* تفاصيل المنتج بتظهر بعده بجزء من الثانية */}
        <FadeIn delay={0.3}>
          <div className="md:sticky md:top-24 md:self-start">
            <p className="text-xs uppercase tracking-widest text-neutral-500">
              {product.category}
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl uppercase tracking-tight">
              {product.name}
            </h1>
            <p className="mt-3 text-xl">{formatPrice(product.price)}</p>

            {product.description && (
              <p className="mt-6 text-sm leading-relaxed text-neutral-600">
                {product.description}
              </p>
            )}

            <div className="mt-8 space-y-4">
              <VariantSelector product={product} />
              <WishlistButton
                variant="inline"
                productId={product.id}
                productName={product.name}
                initialWished={wishlistIds.has(product.id)}
              />
            </div>
          </div>
        </FadeIn>
      </div>

      {/* قسم المنتجات المشابهة */}
      {related.length > 0 && (
        <section className="mt-20">
          <FadeIn>
            <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-tight">
              You may also like
            </h2>
          </FadeIn>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((p, i) => (
              <FadeIn key={p.id} delay={i * 0.1}>
                <ProductCard
                  product={p}
                  wished={wishlistIds.has(p.id)}
                />
              </FadeIn>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}