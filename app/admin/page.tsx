import Link from "next/link";
import { z } from "zod";
import { getDashboardStats } from "@/features/admin/dashboard/queries";
import {
  orderStatusLabel,
  orderStatusStyle,
} from "@/features/orders/status";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const searchSchema = z.object({
  days: z.enum(["7", "30", "90"]).catch("30"),
});

const PERIODS = [7, 30, 90] as const;

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function StatCard({
  label,
  value,
  note,
  href,
}: {
  label: string;
  value: string;
  note?: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs uppercase tracking-widest text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-medium">{value}</p>
      {note && <p className="mt-1 text-xs text-neutral-500">{note}</p>}
    </>
  );
  const className = "border border-neutral-200 bg-white p-4";
  return href ? (
    <Link href={href} className={`${className} block hover:border-neutral-950`}>
      {content}
    </Link>
  ) : (
    <div className={className}>{content}</div>
  );
}

export default async function AdminHomePage({ searchParams }: Props) {
  await requireAdmin();

  const days = Number(searchSchema.parse(await searchParams).days);
  const supabase = await createClient();

  const [stats, recentRes] = await Promise.all([
    getDashboardStats(days),
    supabase
      .from("orders")
      .select("id, order_number, status, total, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (recentRes.error) throw new Error(recentRes.error.message);
  const recent = recentRes.data ?? [];

  const maxDaily = Math.max(...stats.daily.map((d) => d.total), 1);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase">
          Dashboard
        </h1>
        <nav aria-label="Period" className="flex gap-2 text-sm">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={p === 30 ? "/admin" : `/admin?days=${p}`}
              aria-current={p === days ? "page" : undefined}
              className={`border px-3 py-1.5 ${
                p === days
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-300 hover:border-neutral-950"
              }`}
            >
              Last {p} days
            </Link>
          ))}
        </nav>
      </div>

      <section
        aria-label={`Summary, last ${days} days`}
        className="grid grid-cols-2 gap-4 lg:grid-cols-3"
      >
        <StatCard
          label="Sales"
          value={formatPrice(stats.sales.sales_total)}
          note="Orders that weren't cancelled"
        />
        <StatCard
          label="Orders"
          value={String(stats.sales.orders_count)}
          note={`${stats.sales.cancelled_count} cancelled`}
        />
        <StatCard
          label="Collected"
          value={formatPrice(stats.sales.collected_total)}
          note="Orders marked as paid"
        />
        <StatCard
          label="Pending orders"
          value={String(stats.pending_orders)}
          note="All time, waiting for confirmation"
          href="/admin/orders?status=pending"
        />
        <StatCard
          label="Products"
          value={String(stats.products.active)}
          note={`${stats.products.hidden} hidden`}
          href="/admin/products"
        />
        <StatCard
          label="Low stock"
          value={String(stats.low_stock_count)}
          note="Variants with 5 or fewer left"
        />
      </section>

      <section className="border border-neutral-200 bg-white p-5">
        <h2 className="text-xs font-medium uppercase tracking-widest">
          Sales, last 14 days
        </h2>
        <div
          className="mt-4 flex h-40 items-end gap-1.5"
          aria-hidden="true"
        >
          {stats.daily.map((d) => (
            <div
              key={d.day}
              className="flex h-full flex-1 flex-col justify-end"
              title={`${d.day}: ${formatPrice(d.total)} (${d.orders} orders)`}
            >
              <div
                className="w-full bg-neutral-950"
                style={{
                  height: d.total > 0 ? `${Math.max((d.total / maxDaily) * 100, 2)}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1.5 text-[10px] text-neutral-500" aria-hidden="true">
          {stats.daily.map((d) => (
            <span key={d.day} className="flex-1 text-center">
              {d.day.slice(8)}
            </span>
          ))}
        </div>
        {/* نسخة نصية للقارئات الصوتية */}
        <table className="sr-only">
          <caption>Sales per day</caption>
          <tbody>
            {stats.daily.map((d) => (
              <tr key={d.day}>
                <th>{d.day}</th>
                <td>{formatPrice(d.total)}</td>
                <td>{d.orders} orders</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest">
            Top products, last {days} days
          </h2>
          {stats.top_products.length === 0 ? (
            <p className="text-sm text-neutral-500">No sales in this period.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {stats.top_products.map((p, i) => (
                <li key={p.name} className="flex justify-between gap-4">
                  <span>
                    {i + 1}. {p.name}
                  </span>
                  <span className="text-neutral-600">
                    {p.units} sold · {formatPrice(p.revenue)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="border border-neutral-200 bg-white p-5">
          <h2 className="mb-3 text-xs font-medium uppercase tracking-widest">
            Low stock
          </h2>
          {stats.low_stock.length === 0 ? (
            <p className="text-sm text-neutral-500">
              Nothing is running low.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.low_stock.map((v) => (
                <li
                  key={`${v.product_id}-${v.size}-${v.color}`}
                  className="flex justify-between gap-4"
                >
                  <Link
                    href={`/admin/products/${v.product_id}/edit`}
                    className="underline underline-offset-4"
                  >
                    {v.name} · {v.color} / {v.size}
                  </Link>
                  <span
                    className={v.stock === 0 ? "text-red-700" : "text-amber-700"}
                  >
                    {v.stock === 0 ? "Out of stock" : `${v.stock} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {stats.low_stock_count > stats.low_stock.length && (
            <p className="mt-3 text-xs text-neutral-500">
              Showing {stats.low_stock.length} of {stats.low_stock_count}.
            </p>
          )}
        </section>
      </div>

      <section className="border border-neutral-200 bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-widest">
            Recent orders
          </h2>
          <Link
            href="/admin/orders"
            className="text-sm underline underline-offset-4"
          >
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-neutral-500">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-neutral-100 text-sm">
            {recent.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/orders/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 hover:underline"
                >
                  <span className="font-medium">#{o.order_number}</span>
                  <span className="text-neutral-600">
                    {formatDateTime(o.created_at)}
                  </span>
                  <span
                    className={`px-2 py-1 text-xs ${orderStatusStyle(o.status)}`}
                  >
                    {orderStatusLabel(o.status)}
                  </span>
                  <span>{formatPrice(Number(o.total))}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}