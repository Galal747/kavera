export const PRODUCT_CATEGORIES = [
  "men",
  "women",
  "oversized",
  "hoodies",
  "accessories",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type ProductVariant = {
  id: string;
  size: string;
  colorHex: string;
  stock: number;
  price: number; // السعر الفعلي (price_override لو موجود، وإلا السعر الأساسي)
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  price: number; // بالجنيه المصري
  isNew: boolean;
  inStock: boolean;
  colors: string[]; // hex
  sizes: string[];
  images: string[]; // روابط كاملة، الأولى هي الرئيسية
  variants: ProductVariant[];
};