import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ProductCard } from "@/features/products/components/product-card";
import { VariantSelector } from "@/features/products/components/variant-selector";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/features/products/queries";
import { formatPrice } from "@/lib/format";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { getWishlistProductIds } from "@/features/wishlist/queries";

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
    title: `${product.name} | Atelier Cairo`,
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
  const [mainImage, ...otherImages] = product.images;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        {mainImage ? (
          <div className="grid grid-cols-2 gap-3">
            {/* الصورة الرئيسية كبيرة وبتاخد العرض كله */}
            <div className="relative col-span-2 aspect-[3/4] bg-neutral-200">
              <Image
                src={mainImage}
                alt={product.name}
                fill
                sizes="(min-width: 768px) 50vw, 100vw"
                loading="eager"
                className="object-cover"
              />
            </div>
            {otherImages.map((src, i) => (
              <div key={src} className="relative aspect-[3/4] bg-neutral-200">
                <Image
                  src={src}
                  alt={`${product.name} view ${i + 2}`}
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex aspect-[3/4] items-center justify-center bg-neutral-200 text-sm uppercase tracking-widest text-neutral-400">
            No image
          </div>
        )}

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
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-tight">
            You may also like
          </h2>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                wished={wishlistIds.has(p.id)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}