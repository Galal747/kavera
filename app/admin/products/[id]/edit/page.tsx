import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { DeleteProductButton } from "@/features/admin/products/components/delete-product-button";
import { ProductForm } from "@/features/admin/products/components/product-form";
import {
  VariantsManager,
  type VariantRowData,
} from "@/features/admin/products/components/variants-manager";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  await requireAdmin();

  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const supabase = await createClient();
  const [productRes, categoriesRes, sizesRes, colorsRes] = await Promise.all([
    supabase
      .from("products")
      .select(
        `id, slug, name, description, base_price, category_id,
         is_active, is_featured, is_new,
         product_variants (
           id, sku, stock_quantity, price_override,
           sizes ( name, sort_order ),
           colors ( name, hex )
         )`,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase.from("categories").select("id, name").order("name"),
    supabase.from("sizes").select("id, name").order("sort_order"),
    supabase.from("colors").select("id, name").order("name"),
  ]);

  const product = productRes.data;
  if (!product) notFound();

  const variants: VariantRowData[] = [...product.product_variants]
    .sort(
      (a, b) =>
        a.sizes.sort_order - b.sizes.sort_order ||
        a.colors.name.localeCompare(b.colors.name),
    )
    .map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.sizes.name,
      color: v.colors.name,
      colorHex: v.colors.hex,
      stock: v.stock_quantity,
      priceOverride: v.price_override === null ? null : Number(v.price_override),
    }));

  return (
    <div className="space-y-12">
      <div>
        <Link
          href="/admin/products"
          className="text-sm text-neutral-600 underline underline-offset-4"
        >
          ← Back to products
        </Link>
        <h1 className="mb-6 mt-3 font-[family-name:var(--font-display)] text-3xl uppercase">
          Edit product
        </h1>
        <ProductForm
          key={product.id}
          categories={categoriesRes.data ?? []}
          product={{
            id: product.id,
            values: {
              name: product.name,
              slug: product.slug,
              description: product.description ?? "",
              price: String(Number(product.base_price)),
              categoryId: product.category_id,
              isActive: product.is_active,
              isFeatured: product.is_featured,
              isNew: product.is_new,
            },
          }}
        />
      </div>

      <VariantsManager
        productId={product.id}
        variants={variants}
        sizes={sizesRes.data ?? []}
        colors={colorsRes.data ?? []}
      />

      <section className="space-y-3 border-t border-neutral-200 pt-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase">
          Danger zone
        </h2>
        <DeleteProductButton productId={product.id} productName={product.name} />
      </section>
    </div>
  );
}