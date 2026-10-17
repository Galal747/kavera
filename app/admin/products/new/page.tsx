import Link from "next/link";
import { ProductForm } from "@/features/admin/products/components/product-form";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  await requireAdmin();

  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  return (
    <div>
      <Link
        href="/admin/products"
        className="text-sm text-neutral-600 underline underline-offset-4"
      >
        ← Back to products
      </Link>
      <h1 className="mb-6 mt-3 font-[family-name:var(--font-display)] text-3xl uppercase">
        New product
      </h1>
      <ProductForm categories={categories ?? []} />
    </div>
  );
}