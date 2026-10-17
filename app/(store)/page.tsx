import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { NewsletterForm } from "@/features/home/components/newsletter-form";
import { ProductCard } from "@/features/products/components/product-card";
import {
    getBestSellers,
    getNewArrivals,
} from "@/features/products/queries";

const collections = [
    { label: "Oversized Tees", href: "/shop?category=oversized" },
    { label: "Hoodies", href: "/shop?category=hoodies" },
    { label: "Accessories", href: "/shop?category=accessories" },
];

export default async function HomePage() {
    const [newArrivals, bestSellers] = await Promise.all([
        getNewArrivals(),
        getBestSellers(),
    ]);

    return (
        <>
            {/* Hero */}
            <section className="flex min-h-[80vh] flex-col items-center justify-center gap-6 bg-neutral-950 px-6 text-center text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-400">
                    Autumn / Winter 2026
                </p>
                <h1 className="font-(family-name:--font-display) text-6xl uppercase leading-none tracking-tight md:text-8xl">
                    Made in Cairo
                </h1>
                <p className="max-w-md text-neutral-400">
                    Heavyweight essentials, cut for the city.
                </p>
                <Link
                    href="/shop"
                    className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                    Shop the drop
                </Link>
            </section>

            {/* Promo banner */}
            <div className="bg-neutral-200 py-3 text-center text-xs uppercase tracking-widest text-neutral-800">
                Free shipping on orders over 1500 EGP
            </div>

            {/* Featured collections */}
            <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
                <h2 className="font-(family-name:--font-display) text-3xl uppercase tracking-tight">
                    Collections
                </h2>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    {collections.map((c) => (
                        <Link
                            key={c.href}
                            href={c.href}
                            className="group relative flex aspect-4/5 items-end bg-neutral-200 p-5"
                        >
                            <span className="font-(family-name:--font-display) text-2xl uppercase tracking-tight transition-transform duration-300 group-hover:translate-x-1">
                                {c.label} →
                            </span>
                        </Link>
                    ))}
                </div>
            </section>

            {/* New arrivals */}
            <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
                <div className="flex items-end justify-between">
                    <h2 className="font-(family-name:--font-display) text-3xl uppercase tracking-tight">
                        New arrivals
                    </h2>
                    <Link href="/shop" className="text-sm underline underline-offset-4">
                        View all
                    </Link>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
                    {newArrivals.map((p) => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </section>

            {/* Best sellers */}
            <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
                <h2 className="font-(family-name:--font-display) text-3xl uppercase tracking-tight">
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
                <h2 className="font-(family-name:--font-display) text-3xl uppercase tracking-tight">
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