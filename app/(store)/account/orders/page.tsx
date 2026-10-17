import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";import {
  orderStatusLabel,
  orderStatusStyle,
} from "@/features/orders/status";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My orders | Atelier Cairo" };

export default async function OrdersPage() {
  const user = await requireUser("/account/orders");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total, created_at, order_items ( quantity )")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  const orders = data ?? [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link
        href="/account"
        className="text-sm text-neutral-600 underline underline-offset-4"
      >
        ← Back to account
      </Link>
      <h1 className="mb-8 mt-3 font-(family-name:--font-display) text-4xl uppercase tracking-tight">
        My orders
      </h1>

      {orders.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-neutral-600">You haven&apos;t placed any orders yet.</p>
          <Link href="/shop" className={buttonVariants({ className: "mt-6" })}>
  Start shopping
</Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((order) => {
            const itemCount = order.order_items.reduce(
              (sum, item) => sum + item.quantity,
              0,
            );
            return (
              <li key={order.id}>
                <Link
                  href={`/account/orders/${order.id}`}
                  className="flex flex-col gap-3 border border-neutral-200 bg-white p-5 text-sm transition-colors hover:border-neutral-950 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <p className="font-medium">Order #{order.order_number}</p>
                    <p className="text-neutral-600">
                      {formatDateTime(order.created_at)} · {itemCount}{" "}
                      {itemCount === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-1 text-xs ${orderStatusStyle(order.status)}`}
                    >
                      {orderStatusLabel(order.status)}
                    </span>
                    <span className="font-medium">
                      {formatPrice(Number(order.total))}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}