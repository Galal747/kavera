import type { Product } from "@/types/product";
import { mockProducts } from "./mock-data";

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return mockProducts.find((p) => p.slug === slug) ?? null;
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  return mockProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
}