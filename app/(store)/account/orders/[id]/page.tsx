import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import {
  orderStatusLabel,
  orderStatusStyle,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/features/orders/status";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { addressSnapshotSchema } from "@/features/orders/address-snapshot";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
};

export default async function OrderDetailsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { placed } = await searchParams;
  if (!z.uuid().safeParse(id).success) notFound();

  const user = await requireUser(`/account/orders/${id}`);

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select(
      `id, order_number, status, payment_method, payment_status,
       subtotal, discount, shipping_fee, total, coupon_code,
       shipping_address, created_at,
       order_items ( id, product_name, size_name, color_name, unit_price, quantity, line_total )`,
    )
    .eq("id", id)
    .eq("user_id", user.id) // طلباتي أنا بس، حتى لو أنا أدمن
    .maybeSingle();
  if (!order) notFound();

  const address = addressSnapshotSchema.safeParse(order.shipping_address);
  const total = Number(order.total);
  const discount = Number(order.discount);
  const shippingFee = Number(order.shipping_fee);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link
        href="/account/orders"
        className="text-sm text-neutral-600 underline underline-offset-4"
      >
        ← All orders
      </Link>

      {placed === "1" && (
        <div
          className="mt-4 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          role="status"
        >
          <p className="font-medium">Thank you! Your order has been placed.</p>
          <p className="mt-1">
            {order.payment_method === "cod"
              ? `Please have ${formatPrice(total)} ready in cash when it arrives.`
              : "We'll let you know as soon as it ships."}
          </p>
        </div>
      )}

      <div className="mb-8 mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-[family-name:var(--font-display)] text-4xl uppercase tracking-tight">
          Order #{order.order_number}
        </h1>
        <span className={`px-2 py-1 text-xs ${orderStatusStyle(order.status)}`}>
          {orderStatusLabel(order.status)}
        </span>
      </div>
      <p className="-mt-6 mb-8 text-sm text-neutral-600">
        Placed on {formatDateTime(order.created_at)}
      </p>

      <section className="border border-neutral-200 bg-white">
        <ul className="divide-y divide-neutral-100">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 p-4 text-sm">
              <div>
                <p className="font-medium">{item.product_name}</p>
                <p className="text-xs text-neutral-600">
                  {item.color_name} / {item.size_name} × {item.quantity}
                </p>
                <p className="text-xs text-neutral-500">
                  {formatPrice(Number(item.unit_price))} each
                </p>
              </div>
              <p>{formatPrice(Number(item.line_total))}</p>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-neutral-200 p-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatPrice(Number(order.subtotal))}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>
                Discount{order.coupon_code ? ` (${order.coupon_code})` : ""}
              </dt>
              <dd>−{formatPrice(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{shippingFee === 0 ? "Free" : formatPrice(shippingFee)}</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-medium">
            <dt>Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
      </section>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <section className="space-y-1 border border-neutral-200 bg-white p-4 text-sm">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-widest">
            Shipping address
          </h2>
          {address.success ? (
            <>
              <p className="font-medium">{address.data.full_name}</p>
              <p>{address.data.street}</p>
              {address.data.notes && (
                <p className="text-neutral-600">{address.data.notes}</p>
              )}
              <p>
                {address.data.city}, {address.data.governorate}
              </p>
              <p className="text-neutral-600">{address.data.phone}</p>
            </>
          ) : (
            <p className="text-neutral-600">Address unavailable.</p>
          )}
        </section>

        <section className="space-y-1 border border-neutral-200 bg-white p-4 text-sm">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-widest">
            Payment
          </h2>
          <p>{paymentMethodLabel(order.payment_method)}</p>
          <p className="text-neutral-600">
            Status: {paymentStatusLabel(order.payment_status)}
          </p>
        </section>
      </div>
    </div>
  );
}