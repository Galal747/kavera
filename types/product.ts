export const PRODUCT_CATEGORIES = [
  "men",
  "women",
  "oversized",
  "hoodies",
  "accessories",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  price: number; 
  isNew: boolean;
  inStock: boolean;
  colors: string[]; 
  sizes: string[];
};