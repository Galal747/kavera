import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/features/products/components/pagination";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

const searchSchema = z.object({
  q: z.string().trim().max(60).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCustomersPage({ searchParams }: Props) {
  await requireAdmin();

  const { q, page } = searchSchema.parse(await searchParams);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("admin_list_customers", {
    // بنعمل escape لرموز البحث الخاصة، عشان الاسم يتبحث عنه زي ما اتكتب
    p_search: q ? q.replace(/[\\%_]/g, "\\$&") : undefined,
    p_limit: PAGE_SIZE,
    p_offset: (page - 1) * PAGE_SIZE,
  });
  if (error) throw new Error(error.message);

  const customers = data ?? [];
  if (customers.length === 0 && page > 1) redirect("/admin/customers");

  const total = customers[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildHref(target: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/admin/customers?${qs}` : "/admin/customers";
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase">
        Customers
      </h1>
      <p className="mt-2 max-w-xl text-sm text-neutral-600">
        A read-only overview. Emails and phone numbers aren&apos;t shown here,
        and roles can only be changed directly in the database.
      </p>

      <form className="mt-6 flex max-w-md gap-2" role="search">
        <input
          name="q"
          type="search"
          defaultValue={q ?? ""}
          placeholder="Search by name..."
          aria-label="Search customers"
          maxLength={60}
          className="h-9 flex-1 border border-neutral-300 bg-white px-3 text-sm"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
        {q && (
          <Link
            href="/admin/customers"
            className="self-center text-sm underline underline-offset-4"
          >
            Clear
          </Link>
        )}
      </form>

      <p className="mt-4 text-sm text-neutral-600">
        {total} {total === 1 ? "customer" : "customers"}
      </p>

      {customers.length === 0 ? (
        <p className="mt-10 text-center text-neutral-500">
          No customers found.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total spent</th>
                <th className="px-4 py-3">Last order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr
                  key={c.customer_id}
                  className="border-b border-neutral-100 last:border-0"
                >
                  <td className="px-4 py-3 font-medium">
                    {c.customer_name ?? "—"}
                    {c.customer_role === "admin" && (
                      <span className="ml-2 bg-neutral-950 px-2 py-0.5 text-xs uppercase tracking-wider text-white">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {formatDateTime(c.joined_at)}
                  </td>
                  <td className="px-4 py-3">{c.orders_count}</td>
                  <td className="px-4 py-3">
                    {formatPrice(Number(c.total_spent))}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">
                    {c.last_order_at ? formatDateTime(c.last_order_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} totalPages={totalPages} buildHref={buildHref} />
    </div>
  );
}