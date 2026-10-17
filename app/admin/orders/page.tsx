import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { addressSnapshotSchema } from "@/features/orders/address-snapshot";
import {
  ORDER_STATUSES,
  orderStatusLabel,
  orderStatusStyle,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/features/orders/status";
import { Pagination } from "@/features/products/components/pagination";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const PAGE_SIZE = 10;

// الـ URL مدخل من المستخدم: أي قيمة غلط ترجع للافتراضي
const searchSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional().catch(undefined),
  q: z
    .string()
    .trim()
    .regex(/^\d{1,12}$/)
    .optional()
    .catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
});

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminOrdersPage({ searchParams }: Props) {
  await requireAdmin();

  const { status, q, page } = searchSchema.parse(await searchParams);

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select(
      "id, order_number, status, payment_method, payment_status, total, created_at, shipping_address",
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .order("id", { ascending: true });

  if (status) query = query.eq("status", status);
  if (q) query = query.eq("order_number", Number(q));

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(from, from + PAGE_SIZE - 1);

  if (error?.code === "PGRST103") redirect("/admin/orders");
  if (error) throw new Error(error.message);

  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const orders = data ?? [];

  function buildHref(target: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (q) params.set("q", q);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase">
        Orders
      </h1>

      <form className="mt-6 flex flex-wrap items-center gap-2" role="search">
        <select
          name="status"
          defaultValue={status ?? ""}
          aria-label="Filter by status"
          className="h-9 border border-neutral-300 bg-white px-3 text-sm"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {orderStatusLabel(s)}
            </option>
          ))}
        </select>
        <input
          name="q"
          inputMode="numeric"
          defaultValue={q ?? ""}
          placeholder="Order number"
          aria-label="Search by order number"
          maxLength={12}
          className="h-9 w-40 border border-neutral-300 bg-white px-3 text-sm"
        />
        <Button type="submit" variant="outline">
          Filter
        </Button>
        {(status || q) && (
          <Link
            href="/admin/orders"
            className="text-sm underline underline-offset-4"
          >
            Clear
          </Link>
        )}
      </form>

      <p className="mt-4 text-sm text-neutral-600">
        {total} {total === 1 ? "order" : "orders"}
      </p>

      {orders.length === 0 ? (
        <p className="mt-10 text-center text-neutral-500">No orders found.</p>
      ) : (
        <div className="mt-4 overflow-x-auto border border-neutral-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const address = addressSnapshotSchema.safeParse(
                  order.shipping_address,
                );
                return (
                  <tr
                    key={order.id}
                    className="border-b border-neutral-100 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium">
                      #{order.order_number}
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {formatDateTime(order.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      {address.success ? (
                        <>
                          <span className="block">{address.data.full_name}</span>
                          <span className="block text-xs text-neutral-500">
                            {address.data.governorate}
                          </span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="block">
                        {paymentMethodLabel(order.payment_method)}
                      </span>
                      <span className="block text-xs text-neutral-500">
                        {paymentStatusLabel(order.payment_status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs ${orderStatusStyle(order.status)}`}
                      >
                        {orderStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {formatPrice(Number(order.total))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="underline underline-offset-4"
                      >
                        View
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