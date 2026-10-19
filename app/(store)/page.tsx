import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { NewsletterForm } from "@/features/home/components/newsletter-form";
import { ProductCard } from "@/features/products/components/product-card";
import {
  getBestSellers,
  getNewArrivals,
} from "@/features/products/queries";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import Image from "next/image";

const collections = [
  { label: "Oversized Tees", href: "/shop?category=oversized", image: "/brand/collection-oversized.jpg" },
  { label: "Hoodies", href: "/shop?category=hoodies", image: "/brand/collection-hoodies.jpg" },
  { label: "Accessories", href: "/shop?category=accessories", image: "/brand/collection-accessories.jpg" },
];

export default async function HomePage() {
  const [newArrivals, bestSellers, wishlistIds] = await Promise.all([
    getNewArrivals(),
    getBestSellers(),
    getWishlistProductIds(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden bg-neutral-950 px-6 text-center text-white">
        <Image
          src="/brand/hero.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <p className="text-xs uppercase tracking-[0.3em] text-neutral-300">
            Autumn / Winter 2026
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-6xl uppercase leading-none tracking-tight md:text-8xl">
            Made in Cairo
          </h1>
          <p className="max-w-md text-neutral-300">
            Heavyweight essentials, cut for the city.
          </p>
          <Link
            href="/shop"
            className={buttonVariants({ variant: "secondary", size: "lg" })}
          >
            Shop the drop
          </Link>
        </div>
      </section>

      {/* Promo banner */}
      <div className="bg-neutral-200 py-3 text-center text-xs uppercase tracking-widest text-neutral-800">
        Free shipping on orders over 1500 EGP
      </div>

      {/* Featured collections */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-tight">
          Collections
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group relative flex aspect-[4/5] items-end overflow-hidden bg-neutral-200 p-5"
            >
              <Image
                src={c.image}
                alt=""
                fill
                sizes="(min-width: 768px) 33vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <span className="relative z-10 bg-white/90 px-3 py-1.5 font-[family-name:var(--font-display)] text-xl uppercase tracking-tight">
                {c.label} →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <div className="flex items-end justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-tight">
            New arrivals
          </h2>
          <Link href="/shop" className="text-sm underline underline-offset-4">
            View all
          </Link>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} wished={wishlistIds.has(p.id)} />
          ))}
        </div>
      </section>

      {/* Best sellers */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <h2 className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-tight">
          Best sellers
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {bestSellers.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-neutral-950 px-6 py-16 text-center text-white">
        <h2 className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-tight">
          Join the list
        </h2>
        <p className="mx-auto mb-6 mt-2 max-w-sm text-sm text-neutral-400">
          First access to drops and restocks. No spam.
        </p>
        <NewsletterForm />
      </section>
    </>
  );
}