"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/shared/fade-in";

export type Collection = {
    label: string;
    href: string;
    image: string;
};

type CollectionsCarouselProps = {
    items: Collection[];
    title?: string;
    viewAllHref?: string;
};

export function CollectionsCarousel({
    items,
    title = "Collections",
    viewAllHref = "/shop",
}: CollectionsCarouselProps) {
    const scrollerRef = useRef<HTMLDivElement>(null);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);

    const updateButtons = useCallback(() => {
        const el = scrollerRef.current;
        if (!el) return;
        setCanPrev(el.scrollLeft > 4);
        setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }, []);

    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;

        updateButtons();
        el.addEventListener("scroll", updateButtons, { passive: true });
        const observer = new ResizeObserver(updateButtons);
        observer.observe(el);

        return () => {
            el.removeEventListener("scroll", updateButtons);
            observer.disconnect();
        };
    }, [updateButtons, items.length]);

    const scrollByPage = (direction: 1 | -1) => {
        const el = scrollerRef.current;
        if (!el) return;
        el.scrollBy({ left: direction * el.clientWidth * 0.8, behavior: "smooth" });
    };

    return (
        <section className="mx-auto max-w-7xl px-4 py-12 md:px-6 md:py-16">
            <FadeIn>
                <div className="flex items-end justify-between gap-4">
                    <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-500">
                            Shop by
                        </p>
                        <h2 className="font-[family-name:var(--font-display)] text-3xl uppercase leading-none tracking-tight md:text-4xl">
                            {title}
                        </h2>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                        <Link
                            href={viewAllHref}
                            className="mr-1 text-sm underline underline-offset-4 transition-colors hover:text-neutral-600"
                        >
                            View all
                        </Link>
                        <button
                            type="button"
                            onClick={() => scrollByPage(-1)}
                            disabled={!canPrev}
                            aria-label="Previous collections"
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-900 transition-all hover:border-neutral-950 hover:bg-neutral-950 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            type="button"
                            onClick={() => scrollByPage(1)}
                            disabled={!canNext}
                            aria-label="Next collections"
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-900 transition-all hover:border-neutral-950 hover:bg-neutral-950 hover:text-white disabled:pointer-events-none disabled:opacity-30"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </FadeIn>

            {/* -mx-4 px-4 على الموبايل عشان الكروت تطلع لحد حافة الشاشة وتبان الشريحة اللي بعدها */}
            <div
                ref={scrollerRef}
                className="-mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto overscroll-x-contain scroll-smooth px-4 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:mt-8 md:scroll-px-0 md:gap-5 md:px-0 [&::-webkit-scrollbar]:hidden"
            >
                {items.map((item, i) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        draggable={false}
                        className={cn(
                            "group relative aspect-[4/5] shrink-0 snap-start overflow-hidden rounded-xl bg-neutral-200",
                            // موبايل: كارت واحد ونص تقريباً | تابلت: اتنين | ديسكتوب: تلاتة
                            "basis-[76%] sm:basis-[calc((100%-0.75rem)/2)] lg:basis-[calc((100%-2.5rem)/3)]"
                        )}
                    >
                        <Image
                            src={item.image}
                            alt=""
                            fill
                            draggable={false}
                            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 76vw"
                            className="select-none object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />

                        {/* تدرّج غامق تحت عشان النص يتقري على أي صورة */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

                        <span className="absolute left-4 top-4 text-xs tracking-[0.25em] text-white/80">
                            {String(i + 1).padStart(2, "0")}
                        </span>

                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
                            <div className="min-w-0">
                                <h3 className="font-[family-name:var(--font-display)] text-2xl uppercase leading-none tracking-tight md:text-3xl">
                                    {item.label}
                                </h3>
                                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/70">
                                    Shop now
                                </p>
                            </div>
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-neutral-950 transition-transform duration-300 group-hover:-translate-y-1 group-hover:translate-x-1">
                                <ArrowUpRight size={18} />
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}