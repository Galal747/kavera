import Link from "next/link";
import { CurrentYear } from "./current-year";
import { BRAND } from "@/lib/brand";
import { FadeIn } from "@/components/shared/fade-in";

export function Footer() {
    return (
        <footer className="mt-24 bg-neutral-950 text-neutral-300">
            <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 md:grid-cols-3 md:px-6 lg:gap-16">
                
                {/* العمود الأول: معلومات البراند */}
                <FadeIn delay={0.1}>
                    <div>
                        <p className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-wider text-white">
                            {BRAND.name}
                        </p>
                        <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-400">
                            Streetwear built in Egypt, made with intention. Heavyweight essentials, cut for the city.
                        </p>
                    </div>
                </FadeIn>

                {/* العمود الثاني: روابط المتجر */}
                <FadeIn delay={0.2}>
                    <div>
                        <p className="mb-5 text-xs uppercase tracking-widest text-neutral-500">
                            Shop
                        </p>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/shop" className="transition-all duration-300 hover:text-white hover:underline hover:underline-offset-4">
                                    All products
                                </Link>
                            </li>
                            <li>
                                <Link href="/shop?category=hoodies" className="transition-all duration-300 hover:text-white hover:underline hover:underline-offset-4">
                                    Hoodies
                                </Link>
                            </li>
                            <li>
                                <Link href="/shop?category=oversized" className="transition-all duration-300 hover:text-white hover:underline hover:underline-offset-4">
                                    Oversized tees
                                </Link>
                            </li>
                        </ul>
                    </div>
                </FadeIn>

                {/* العمود الثالث: المساعدة والحساب */}
                <FadeIn delay={0.3}>
                    <div>
                        <p className="mb-5 text-xs uppercase tracking-widest text-neutral-500">
                            Help
                        </p>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <Link href="/account" className="transition-all duration-300 hover:text-white hover:underline hover:underline-offset-4">
                                    My account
                                </Link>
                            </li>
                            <li>
                                <Link href="/account/orders" className="transition-all duration-300 hover:text-white hover:underline hover:underline-offset-4">
                                    Order tracking
                                </Link>
                            </li>
                        </ul>
                    </div>
                </FadeIn>
            </div>

            {/* شريط حقوق الملكية تحت */}
            <FadeIn delay={0.4}>
                <div className="border-t border-neutral-900 py-6 text-center text-xs text-neutral-500">
                    © <CurrentYear /> {BRAND.name}. A fictional brand for portfolio purposes.
                </div>
            </FadeIn>
        </footer>
    );
}