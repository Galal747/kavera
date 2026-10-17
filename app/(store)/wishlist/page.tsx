import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/features/products/components/product-card";
import { getWishlistProducts } from "@/features/wishlist/queries";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Wishlist | Atelier Cairo" };

export default async function WishlistPage() {
  await requireUser("/wishlist");
  const products = await getWishlistProducts();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="font-[family-name:var(--font-display)] text-4xl uppercase tracking-tight">
        Wishlist
      </h1>

      {products.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-neutral-600">
            You haven&apos;t saved anything yet.
          </p>
          <Link href="/shop" className={buttonVariants({ className: "mt-6" })}>
  Browse the shop
</Link>
        </div>
      ) : (
        <>
          <p className="mb-8 mt-2 text-sm text-neutral-600">
            {products.length} {products.length === 1 ? "item" : "items"}
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} wished />
            ))}
          </div>
        </>
      )}
    </div>
  );
}