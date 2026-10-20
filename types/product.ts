export const PRODUCT_CATEGORIES = [
  "men",
  "women",
  "t-shirts",
  "hoodies",
  "accessories",
  "Tops",
  "Jacket",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export type ProductVariant = {
  id: string;
  size: string;
  colorHex: string;
  stock: number;
  price: number; 
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: ProductCategory;
  gender: string; 
  price: number; 
  isNew: boolean;
  inStock: boolean;
  colors: string[]; 
  sizes: string[];
  images: string[]; 
  variants: ProductVariant[];
};