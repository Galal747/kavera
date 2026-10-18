import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { addressSnapshotSchema } from "@/features/orders/address-snapshot";
import {
  orderStatusLabel,
  orderStatusStyle,
  paymentMethodLabel,
  paymentStatusLabel,
} from "@/features/orders/status";
import { PayNowButton } from "@/features/payments/components/pay-now-button";
import { PaymentStatusWatcher } from "@/features/payments/components/payment-status-watcher";
import { requireUser } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string; payment?: string }>;
};

export default async function OrderDetailsPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { placed, payment } = await searchParams;
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

  const isCard = order.payment_method === "card";
  const awaitingPayment =
    isCard &&
    order.status === "pending" &&
    (order.payment_status === "unpaid" || order.payment_status === "failed");
  const returning = payment === "return";
  const paidCardOrder = isCard && order.payment_status === "paid";
  const cancelledUnpaid =
    isCard && order.status === "cancelled" && order.payment_status !== "paid";

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
            Please have {formatPrice(total)} ready in cash when it arrives.
          </p>
        </div>
      )}

      {paidCardOrder && returning && (
        <div
          className="mt-4 border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
          role="status"
        >
          <p className="font-medium">Payment received. Thank you!</p>
          <p className="mt-1">We&apos;ll start preparing your order.</p>
        </div>
      )}

      {awaitingPayment && returning && order.payment_status === "unpaid" && (
        <div className="mt-4 border border-neutral-200 bg-white p-4">
          <PaymentStatusWatcher />
        </div>
      )}

      {awaitingPayment && !(returning && order.payment_status === "unpaid") && (
        <div className="mt-4 space-y-3 border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-medium">
            {order.payment_status === "failed"
              ? "Your last payment attempt didn't go through."
              : payment === "start_failed"
                ? "Your order is saved, but we couldn't open the payment page."
                : "This order is waiting for payment."}
          </p>
          <p>
            Your items are reserved for about an hour. Unpaid card orders are
            cancelled automatically after that.
          </p>
          <PayNowButton
            orderId={order.id}
            label={
              order.payment_status === "failed" ? "Try paying again" : "Pay now"
            }
          />
        </div>
      )}

      {cancelledUnpaid && (
        <div className="mt-4 border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
          This order was cancelled and its items were released. You can place a
          new order any time.
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