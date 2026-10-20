// مكان واحد لهوية البراند. غيّر هنا والتغيير يوصل لكل الموقع.
export const BRAND = {
  name: "KAVERA",
  tagline: "Egyptian streetwear, made with intention.",
  logo: {
    // ضع ملف اللوجو في public/brand/ وغيّر المسار لو الاسم أو الصيغة مختلفة (svg أو png أو webp)
    src: "/brand/logo.svg",
    // الأبعاد الحقيقية للملف بالبكسل (مش حجم العرض). دي اللي بتحافظ على نسبة الصورة.
    width: 160,
    height: 40,
    alt: "KAVERA",
  },
} as const;