import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Button, buttonVariants } from "@/components/ui/button";
import { Pagination } from "@/features/products/components/pagination";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;
const LOW_STOCK_THRESHOLD = 5;

const searchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function stockStatus(variantCount: number, totalStock: number) {
  if (variantCount === 0)
    return { label: "No variants", style: "bg-neutral-200 text-neutral-700" };
  if (totalStock === 0)
    return { label: "Out of stock", style: "bg-red-100 text-red-700" };
  if (totalStock <= LOW_STOCK_THRESHOLD)
    return {
      label: `Low stock (${totalStock})`,
      style: "bg-amber-100 text-amber-800",
    };
  return {
    label: `${totalStock} in stock`,
    style: "bg-emerald-100 text-emerald-800",
  };
}

export default async function AdminProductsPage({ searchParams }: Props) {
  await requireAdmin();

  const { q, page } = searchSchema.parse(await searchParams);

  const supabase = await createClient();
  let query = supabase
    .from("products")
    .select(
      "id, slug, name, base_price, is_active, categories ( name ), product_variants ( stock_quantity )",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (q) {
    const term = q.replace(/[\\%_]/g, "\\$&");
    query = query.ilike("name", `%${term}%`);
  }

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);

  // صفحة أكبر من آخر صفحة: نرجع للأولى
  if (error?.code === "PGRST103") redirect("/admin/products");
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(target: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase">
          Products
        </h1>
        <Link href="/admin/products/new" className={buttonVariants()}>
          New product
        </Link>
      </div>

      <form className="mt-6 flex max-w-md gap-2" role="search">
        <input
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search by name..."
          aria-label="Search products"
          maxLength={100}
          className="h-9 flex-1 border border-neutral-300 bg-white px-3 text-sm"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

      <p className="mt-4 text-sm text-neutral-600">
        {total} {total === 1 ? "product" : "products"}
      </p>

      {(data ?? []).length === 0 ? (
        <p className="mt-10 text-center text-neutral-500">
          No products found.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((p) => {
                const variants = p.product_variants;
                const totalStock = variants.reduce(
                  (sum, v) => sum + v.stock_quantity,
                  0,
                );
                const stock = stockStatus(variants.length, totalStock);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      {p.categories?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {formatPrice(Number(p.base_price))}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs ${stock.style}`}>
                        {stock.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {p.is_active ? (
                        <span className="text-emerald-700">Active</span>
                      ) : (
                        <span className="text-neutral-500">Hidden</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="underline underline-offset-4"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}