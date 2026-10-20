export type HeroButton = {
  label: string;
  href: string;
  // primary = أبيض مصمت، secondary = شفاف بإطار أبيض
  variant?: "primary" | "secondary";
};

export type HeroSlide = {
  id: string;
  /** مسار الصورة جوه public/ (مثلًا /brand/slide-1.jpg) */
  image: string;
  /** وصف الصورة. سيبه فاضي لو الصورة زخرفية بس. */
  imageAlt?: string;
  eyebrow?: string;
  heading: string;
  description: string;
  buttons: HeroButton[];
  align?: "left" | "center";
};

// الوقت بين الشرايح بالمللي ثانية
export const HERO_AUTOPLAY_MS = 6000;

// محتوى السلايدر: عدّل هنا بس (أو ضيف/امسح شرايح). مفيش حاجة تانية محتاجة تتغيّر.
export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "drop",
    image: "/brand/slide-1.jpg",
    eyebrow: "Autumn / Winter 2026",
    heading: "Made in Cairo",
    description: "Heavyweight essentials, cut for the city.",
    buttons: [
      { label: "Shop the drop", href: "/shop", variant: "primary" },
      { label: "Hoodies", href: "/shop?category=hoodies", variant: "secondary" },
    ],
    align: "left",
  },
  {
    id: "oversized",
    image: "/brand/slide-2.jpg",
    eyebrow: "Oversized",
    heading: "Relaxed fits",
    description: "Oversized tees in heavyweight cotton.",
    buttons: [
      { label: "Shop oversized", href: "/shop?category=oversized", variant: "primary" },
      { label: "View all", href: "/shop", variant: "secondary" },
    ],
    align: "left",
  },
  {
    id: "new",
    image: "/brand/slide-3.jpg",
    eyebrow: "New arrivals",
    heading: "Just landed",
    description: "The latest pieces from Atelier Cairo.",
    buttons: [{ label: "Shop new arrivals", href: "/shop", variant: "primary" }],
    align: "center",
  },
];