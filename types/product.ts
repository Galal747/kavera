export type Product = {
  id: string;
  slug: string;
  name: string;
  category: "men" | "women" | "oversized" | "hoodies" | "accessories";
  price: number; 
  isNew: boolean;
  inStock: boolean;
  colors: string[]; 
  sizes: string[];
};