"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { buttonVariants } from "@/components/ui/button";
import { getSwipeDirection, wrapIndex } from "@/lib/carousel";
import { cn } from "@/lib/utils";
import type { HeroSlide } from "../hero-slides";
import { motion } from "framer-motion";

// تدرّج غامق خفيف فوق الصورة عشان النص يتقري على أي صورة
const OVERLAY =
  "linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.2) 55%, rgba(0,0,0,0.4))";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

// الفوكس بالكيبورد بس (مش بعد ضغطة ماوس أو لمس)
function isKeyboardFocus(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    return true;
  }
}

type HeroSliderProps = {
  slides: HeroSlide[];
  // وقت التقليب التلقائي: قللناه لـ 2500 ملي ثانية (2.5 ثانية)
  autoPlayMs?: number;
};

export function HeroSlider({ slides, autoPlayMs = 2500 }: HeroSliderProps) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [touching, setTouching] = useState(false);

  // بداية السحب (ماوس أو لمس) + هل اللي حصل سحب فعلاً ولا كليك عادي
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const didDrag = useRef(false);

  // اللي مفعّل "تقليل الحركة" في جهازه ما بنحرّكلوش الشرايح لوحدها
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );

  const autoplay =
    count > 1 &&
    !userPaused &&
    !hovering &&
    !keyboardFocus &&
    !touching &&
    !reducedMotion;

  // مؤقّت جديد مع كل شريحة: التنقل اليدوي بيعيد العدّ من الأول
  useEffect(() => {
    if (!autoplay) return;
    const timer = window.setTimeout(
      () => setIndex((i) => wrapIndex(i + 1, count)),
      autoPlayMs,
    );
    return () => window.clearTimeout(timer);
  }, [autoplay, index, autoPlayMs, count]);

  if (count === 0) return null;

  const goTo = (target: number) => setIndex(wrapIndex(target, count));

  const resetDrag = () => {
    dragStart.current = null;
    setTouching(false);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured collections"
      className="relative h-[75svh] max-h-[820px] min-h-[460px] w-full touch-pan-y cursor-grab select-none overflow-hidden bg-neutral-950 active:cursor-grabbing md:h-[85svh]"
      onPointerEnter={(e) => {
        if (e.pointerType === "mouse") setHovering(true);
      }}
      onPointerLeave={() => {
        setHovering(false);
        resetDrag();
      }}
      onFocus={(e) => {
        if (isKeyboardFocus(e.target)) setKeyboardFocus(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setKeyboardFocus(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") goTo(index + 1);
        else if (e.key === "ArrowLeft") goTo(index - 1);
      }}
      // السحب بإيدك: بيشتغل بالماوس واللمس مع بعض (Pointer Events)
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        dragStart.current = { x: e.clientX, y: e.clientY };
        didDrag.current = false;
        setTouching(true);
      }}
      onPointerUp={(e) => {
        const start = dragStart.current;
        resetDrag();
        if (!start) return;
        const direction = getSwipeDirection(
          e.clientX - start.x,
          e.clientY - start.y,
        );
        if (direction === "next") {
          didDrag.current = true;
          goTo(index + 1);
        } else if (direction === "prev") {
          didDrag.current = true;
          goTo(index - 1);
        }
      }}
      onPointerCancel={resetDrag}
      // لو كان سحب، منفتحش اللينك اللي تحت الإيد بالغلط
      onClickCapture={(e) => {
        if (didDrag.current) {
          e.preventDefault();
          e.stopPropagation();
          didDrag.current = false;
        }
      }}
    >
      {/* الشرايح فوق بعض وبتتبدّل بـ fade. الشريحة المخفية inert عشان الكيبورد ما يدخلش فيها */}
      <div className="absolute inset-0" aria-live={autoplay ? "off" : "polite"}>
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none",
                active ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
              )}
            >
              <Image
                src={slide.image}
                alt={slide.imageAlt ?? ""}
                fill
                priority={i === 0}
                sizes="100vw"
                className="select-none object-cover"
                draggable={false}
              />
              <div className="absolute inset-0" style={{ background: OVERLAY }} />

              <div
                className={cn(
                  "relative mx-auto flex h-full max-w-7xl flex-col justify-center px-6 pb-16 md:px-12",
                  slide.align === "center"
                    ? "items-center text-center"
                    : "items-start text-left",
                )}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: active ? 1 : 0, y: active ? 0 : 30 }}
                  transition={{ duration: 0.7, delay: active ? 0.3 : 0, ease: "easeOut" }}
                  className="max-w-xl space-y-5 text-white"
                >
                  {slide.eyebrow && (
                    <p className="text-xs uppercase tracking-[0.3em] text-neutral-200">
                      {slide.eyebrow}
                    </p>
                  )}
                  <h2 className="font-[family-name:var(--font-display)] text-4xl uppercase leading-none tracking-tight sm:text-5xl md:text-7xl">
                    {slide.heading}
                  </h2>
                  <p className="text-base text-neutral-200 md:text-lg">
                    {slide.description}
                  </p>
                  {slide.buttons.length > 0 && (
                    <div
                      className={cn(
                        "flex flex-wrap gap-3 pt-2",
                        slide.align === "center" && "justify-center",
                      )}
                    >
                      {slide.buttons.map((button) => (
                        <Link
                          key={`${button.label}-${button.href}`}
                          href={button.href}
                          draggable={false}
                          className={cn(
                            buttonVariants({
                              size: "lg",
                              variant: button.variant === "secondary" ? "outline" : "default",
                            }),
                            button.variant === "secondary"
                              ? "border-white bg-transparent text-white hover:bg-white hover:text-neutral-950"
                              : "bg-white text-neutral-950 hover:bg-neutral-200"
                          )}
                        >
                          {button.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => goTo(index - 1)}
            className="absolute left-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white md:flex"
          >
            <ChevronLeft size={22} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={() => goTo(index + 1)}
            className="absolute right-4 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white md:flex"
          >
            <ChevronRight size={22} aria-hidden="true" />
          </button>

          <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                onClick={() => goTo(i)}
                className="group flex h-6 w-6 items-center justify-center focus-visible:outline-2 focus-visible:outline-white"
              >
                <span
                  className={cn(
                    "h-2 rounded-full transition-all duration-300",
                    i === index
                      ? "w-6 bg-white"
                      : "w-2 bg-white/50 group-hover:bg-white/80",
                  )}
                />
              </button>
            ))}
          </div>

          {!reducedMotion && (
            <button
              type="button"
              aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
              onClick={() => setUserPaused((paused) => !paused)}
              className="absolute bottom-3 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60 focus-visible:outline-2 focus-visible:outline-white"
            >
              {userPaused ? (
                <Play size={16} aria-hidden="true" />
              ) : (
                <Pause size={16} aria-hidden="true" />
              )}
            </button>
          )}
        </>
      )}
    </section>
  );
}