"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductGalleryProps = {
    images: string[];
};

const MIN_SWIPE = 50;

export function ProductGallery({ images }: ProductGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);

    const startX = useRef<number | null>(null);
    const didSwipe = useRef(false);
    const thumbRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const count = images?.length ?? 0;

    // لو عدد الصور اتغير (مثلا اختار لون تاني) نرجع للأولى
    useEffect(() => {
        setCurrentIndex(0);
    }, [images]);

    // الصورة المصغرة النشطة تتسنتر تلقائي في الشريط
    useEffect(() => {
        thumbRefs.current[currentIndex]?.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
        });
    }, [currentIndex]);

    // كيبورد داخل الـ lightbox + قفل اسكرول الصفحة
    useEffect(() => {
        if (!lightboxOpen) return;

        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightboxOpen(false);
            if (e.key === "ArrowRight") setCurrentIndex((p) => (p === count - 1 ? 0 : p + 1));
            if (e.key === "ArrowLeft") setCurrentIndex((p) => (p === 0 ? count - 1 : p - 1));
        };

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKey);
        };
    }, [lightboxOpen, count]);

    if (!images || count === 0) {
        return (
            <div className="relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden bg-neutral-100 text-sm uppercase text-neutral-400">
                No image
            </div>
        );
    }

    const nextImage = () => setCurrentIndex((p) => (p === count - 1 ? 0 : p + 1));
    const prevImage = () => setCurrentIndex((p) => (p === 0 ? count - 1 : p - 1));

    // Pointer events بتشتغل للماوس واللمس مع بعض
    const handlePointerDown = (e: React.PointerEvent) => {
        startX.current = e.clientX;
        didSwipe.current = false;
    };

    const handlePointerUp = (e: React.PointerEvent) => {
        if (startX.current === null) return;
        const distance = startX.current - e.clientX;
        startX.current = null;

        if (Math.abs(distance) > MIN_SWIPE) {
            didSwipe.current = true;
            if (distance > 0) nextImage();
            else prevImage();
        }
    };

    const handlePointerCancel = () => {
        startX.current = null;
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowRight") nextImage();
        if (e.key === "ArrowLeft") prevImage();
    };

    const handleMainClick = () => {
        // لو كان سحب مش كليك، ما نفتحش الـ lightbox
        if (didSwipe.current) {
            didSwipe.current = false;
            return;
        }
        setLightboxOpen(true);
    };

    return (
        <div
            className="flex w-full min-w-0 flex-col gap-3 sm:gap-4"
            tabIndex={0}
            onKeyDown={handleKeyDown}
        >
            {/* الصورة الأساسية */}
            <div
                className="group relative aspect-[3/4] w-full cursor-grab touch-pan-y select-none overflow-hidden rounded-sm bg-neutral-100 active:cursor-grabbing"
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerCancel}
                onPointerLeave={handlePointerCancel}
                onClick={handleMainClick}
            >
                <Image
                    key={currentIndex}
                    src={images[currentIndex] || ""}
                    alt={`Product image ${currentIndex + 1}`}
                    fill
                    priority={currentIndex === 0}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="pointer-events-none select-none object-contain animate-in fade-in duration-300"
                    draggable={false}
                />

                {/* عداد الصور */}
                <div className="absolute right-3 top-3 rounded-full bg-neutral-900/60 px-3 py-1.5 text-xs font-medium tracking-widest text-white backdrop-blur-md sm:right-4 sm:top-4">
                    {currentIndex + 1} / {count}
                </div>

                {/* أسهم على الصورة الكبيرة (للديسكتوب) */}
                {count > 1 && (
                    <>
                        <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                prevImage();
                            }}
                            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100 md:flex"
                            aria-label="Previous image"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            type="button"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                nextImage();
                            }}
                            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 opacity-0 shadow-md transition-opacity hover:bg-white group-hover:opacity-100 md:flex"
                            aria-label="Next image"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}

                {/* زرار الزووم */}
                <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        setLightboxOpen(true);
                    }}
                    className="absolute bottom-3 right-3 flex h-11 w-11 items-center justify-center rounded-full bg-white text-neutral-900 shadow-lg transition-transform hover:scale-105 active:scale-95 sm:bottom-4 sm:right-4 sm:h-12 sm:w-12"
                    aria-label="Zoom image"
                >
                    <Search size={20} strokeWidth={1.5} />
                </button>
            </div>

            {/* شريط الصور المصغرة */}
            {count > 1 && (
                <div className="flex w-full min-w-0 max-w-full items-center gap-1 rounded-xl border border-neutral-200 bg-white p-2 shadow-sm [contain:inline-size]">
                    <button
                        type="button"
                        onClick={prevImage}
                        className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-400 transition-colors hover:text-neutral-900"
                        aria-label="Previous image"
                    >
                        <ChevronLeft size={20} />
                    </button>

                    {/* min-w-0 ضرورية عشان الـ flex child يقدر يتسكرول بالعرض بدل ما يوسّع الصفحة */}
                    <div className="flex min-w-0 flex-1 snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain scroll-smooth px-1 py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {images.map((img, idx) => (
                            <button
                                type="button"
                                key={idx}
                                ref={(el) => {
                                    thumbRefs.current[idx] = el;
                                }}
                                onClick={() => setCurrentIndex(idx)}
                                aria-label={`Show image ${idx + 1}`}
                                aria-current={currentIndex === idx}
                                className={cn(
                                    "relative h-16 w-12 shrink-0 snap-center overflow-hidden rounded-md border-2 transition-all duration-200 sm:h-20 sm:w-16",
                                    currentIndex === idx
                                        ? "border-neutral-950"
                                        : "border-transparent opacity-60 hover:opacity-100"
                                )}
                            >
                                <Image
                                    src={img || ""}
                                    alt={`Thumbnail ${idx + 1}`}
                                    fill
                                    sizes="64px"
                                    className="object-cover"
                                />
                            </button>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={nextImage}
                        className="flex h-8 w-8 shrink-0 items-center justify-center text-neutral-400 transition-colors hover:text-neutral-900"
                        aria-label="Next image"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}

            {/* Lightbox للزووم */}
            {lightboxOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
                    role="dialog"
                    aria-modal="true"
                    onClick={() => setLightboxOpen(false)}
                >
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(false)}
                        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                        aria-label="Close"
                    >
                        <X size={22} />
                    </button>

                    <div className="absolute left-4 top-4 z-10 rounded-full bg-white/10 px-3 py-1.5 text-xs tracking-widest text-white">
                        {currentIndex + 1} / {count}
                    </div>

                    {count > 1 && (
                        <>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    prevImage();
                                }}
                                className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-4"
                                aria-label="Previous image"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    nextImage();
                                }}
                                className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-4"
                                aria-label="Next image"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </>
                    )}

                    <div
                        className="relative h-[85vh] w-[95vw] max-w-5xl touch-pan-y"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDown={handlePointerDown}
                        onPointerUp={handlePointerUp}
                        onPointerCancel={handlePointerCancel}
                    >
                        <Image
                            src={images[currentIndex] || ""}
                            alt={`Product image ${currentIndex + 1}`}
                            fill
                            sizes="95vw"
                            className="pointer-events-none select-none object-contain"
                            draggable={false}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}