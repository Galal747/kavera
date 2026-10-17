import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductCard } from "@/features/products/components/product-card";
import { VariantSelector } from "@/features/products/components/variant-selector";
import {
  getProductBySlug,
  getRelatedProducts,
} from "@/features/products/queries";
import { formatPrice } from "@/lib/format";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product ? `${product.name} | Atelier Cairo` : "Not found" };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  const related = await getRelatedProducts(product);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="grid gap-10 md:grid-cols-2">
        {/* الصور: placeholders لحد Milestone الصور */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((n) => (
            <div
              key={n}
              className="flex aspect-[3/4] items-center justify-center bg-neutral-200 text-xs uppercase tracking-widest text-neutral-400"
            >
              Image {n}
            </div>
          ))}
        </div>

        <div className="md:sticky md:top-24 md:self-start">
          <p className="text-xs uppercase tracking-widest text-neutral-500">
            {product.category}
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl uppercase tracking-tight">
            {product.name}
          </h1>
          <p className="mt-3 text-xl">{formatPrice(product.price)}</p>

          <p className="mt-6 text-sm leading-relaxed text-neutral-600">
            Heavyweight cotton, relaxed fit, designed in Cairo. Placeholder
            description until the product data comes from the database.
          </p>

          <div className="mt-8">
            <VariantSelector product={product} />
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
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}