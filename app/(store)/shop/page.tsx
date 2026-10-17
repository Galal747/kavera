import { ProductCard } from "@/features/products/components/product-card";
import { mockProducts } from "@/features/products/mock-data";

type ShopPageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { category } = await searchParams;

  const products = category
    ? mockProducts.filter((p) => p.category === category)
    : mockProducts;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl uppercase tracking-tight">
        {category ? category : "All products"}
      </h1>
      <p className="mt-2 text-sm text-neutral-600">
        {products.length} {products.length === 1 ? "item" : "items"}
      </p>

      {products.length === 0 ? (
        <p className="mt-16 text-center text-neutral-500">
          No products in this category yet.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}