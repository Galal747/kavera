import Link from "next/link";
import Image from "next/image"; // ضفنا ده عشان الكروت الجديدة
import { NewsletterForm } from "@/features/home/components/newsletter-form";
import { ProductCard } from "@/features/products/components/product-card";
import {
  getBestSellers,
  getNewArrivals,
} from "@/features/products/queries";
import { getWishlistProductIds } from "@/features/wishlist/queries";
import { ANNOUNCEMENTS } from "@/features/home/announcements";
import { AnnouncementBar } from "@/features/home/components/announcement-bar";
import { CollectionsCarousel } from "@/features/home/components/collections-carousel";
import { HeroSlider } from "@/features/home/components/hero-slider";
import { HERO_AUTOPLAY_MS, HERO_SLIDES } from "@/features/home/hero-slides";
import { BRAND } from "@/lib/brand";
import { FadeIn } from "@/components/shared/fade-in";

const collections = [
  { label: "Oversized Tees", href: "/shop?category=oversized", image: "/collections/oversized-tees.jpg" },
  { label: "Hoodies", href: "/shop?category=hoodies", image: "/collections/hoodies.jpg" },
  { label: "Accessories", href: "/shop?category=accessories", image: "/collections/accessories.jpg" },
];

export default async function HomePage() {
  const [newArrivals, bestSellers, wishlistIds] = await Promise.all([
    getNewArrivals(),
    getBestSellers(),
    getWishlistProductIds(),
  ]);

  return (
    <>
      <h1 className="sr-only">
        {BRAND.name}: {BRAND.tagline}
      </h1>
      <HeroSlider slides={HERO_SLIDES} autoPlayMs={HERO_AUTOPLAY_MS} />
      <AnnouncementBar messages={ANNOUNCEMENTS} />

{/* Gender Collections (سكشن الرجالي والحريمي الجديد) */}
      <section className="mx-auto max-w-7xl px-4 pt-12 pb-6 md:px-6">
        <FadeIn>
          {/* الهيدر الجديد */}
          <div className="mb-6 flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-tight">
              Shop by Gender
            </h2>
          </div>

          {/* خليناهم grid-cols-2 دايماً عشان يبقوا جنب بعض، وقللنا المسافة في الموبايل لـ gap-2 */}
          <div className="grid grid-cols-2 gap-2 md:gap-6">
            
            {/* كارت الرجالي */}
            <Link 
              href="/shop?gender=men" 
              // زودنا الارتفاع هنا: h-[400px] للموبايل و h-[60vh] للشاشات الكبيرة
              className="group relative block h-[400px] w-full overflow-hidden bg-neutral-100 sm:h-[500px] md:h-[60vh] md:min-h-[500px]"
            >
              <Image 
                src="/collections/men.jpg" 
                alt="Shop Men's Collection" 
                fill 
                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-widest text-white sm:text-3xl md:text-5xl">
                  Men
                </h2>
              </div>
            </Link>

            {/* كارت الحريمي */}
            <Link 
              href="/shop?gender=women" 
              // نفس زيادة الارتفاع هنا
              className="group relative block h-[400px] w-full overflow-hidden bg-neutral-100 sm:h-[500px] md:h-[60vh] md:min-h-[500px]"
            >
              <Image 
                src="/collections/woman.jpg" 
                alt="Shop Women's Collection" 
                fill 
                className="object-cover transition-transform duration-700 ease-in-out group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/40" />
              <div className="absolute inset-0 flex items-center justify-center">
                <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-widest text-white sm:text-3xl md:text-5xl">
                  Women
                </h2>
              </div>
            </Link>

          </div>
        </FadeIn>
      </section>

      {/* Featured collections */}
      <CollectionsCarousel items={collections} />

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <FadeIn>
          <div className="flex items-end justify-between">
            <h2 className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-tight">
              New arrivals
            </h2>
            <Link href="/shop" className="text-sm underline underline-offset-4 hover:text-neutral-600 transition-colors">
              View all
            </Link>
          </div>
        </FadeIn>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {newArrivals.map((p, i) => (
            <FadeIn key={p.id} delay={i * 0.1}>
              <ProductCard product={p} wished={wishlistIds.has(p.id)} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Best sellers */}
      <section className="mx-auto max-w-7xl px-4 pb-16 md:px-6">
        <FadeIn>
          <h2 className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-tight">
            Best sellers
          </h2>
        </FadeIn>
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
          {bestSellers.map((p, i) => (
            <FadeIn key={p.id} delay={i * 0.1}>
              <ProductCard product={p} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <FadeIn>
        <section className="bg-neutral-950 px-6 py-16 text-center text-white">
          <h2 className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-tight">
            Join the list
          </h2>
          <p className="mx-auto mb-6 mt-2 max-w-sm text-sm text-neutral-400">
            First access to drops and restocks. No spam.
          </p>
          <NewsletterForm />
        </section>
      </FadeIn>
    </>
  );
}