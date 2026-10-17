import type { Product, ProductCategory } from "@/types/product";
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

export async function getNewArrivals(limit = 4): Promise<Product[]> {
  return mockProducts.filter((p) => p.isNew).slice(0, limit);
}

export async function getBestSellers(limit = 4): Promise<Product[]> {
  return mockProducts.filter((p) => p.inStock).slice(0, limit);
}

export type SortOption = "newest" | "price-asc" | "price-desc" | "name";

export type GetProductsParams = {
  category?: ProductCategory;
  q?: string;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
};

export type PaginatedProducts = {
  items: Product[];
  total: number;
  page: number;
  totalPages: number;
};

export async function getProducts({
  category,
  q,
  sort = "newest",
  page = 1,
  pageSize = 4, // رقم صغير مؤقتًا عشان نشوف الـ pagination. هنخليه 12 بعدين
}: GetProductsParams): Promise<PaginatedProducts> {
  let result = [...mockProducts];

  if (category) {
    result = result.filter((p) => p.category === category);
  }

  if (q) {
    const term = q.toLowerCase();
    result = result.filter((p) => p.name.toLowerCase().includes(term));
  }

  switch (sort) {
    case "price-asc":
      result.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      result.sort((a, b) => b.price - a.price);
      break;
    case "name":
      result.sort((a, b) => a.name.localeCompare(b.name));
      break;
    default:
      // newest: الجديد الأول (مؤقتًا بالـ isNew، هنستخدم created_at مع الـ DB)
      result.sort((a, b) => Number(b.isNew) - Number(a.isNew));
  }

  const total = result.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    items: result.slice(start, start + pageSize),
    total,
    page: safePage,
    totalPages,
  };
}