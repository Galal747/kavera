import Link from "next/link";
import { redirect } from "next/navigation";
import { getAddresses } from "@/features/addresses/queries";
import { getCart } from "@/features/cart/queries";
import { CheckoutForm } from "@/features/checkout/components/checkout-form";
import { requireUser } from "@/lib/auth";
import { getPaymobConfig } from "@/features/payments/config";

export const metadata = { title: "Checkout | Atelier Cairo" };

export default async function CheckoutPage() {
  const user = await requireUser("/checkout");

  const [cart, addresses] = await Promise.all([
    getCart(),
    getAddresses(user.id),
  ]);

  // سلة فاضية أو فيها مشاكل (نفاد مخزون مثلًا): نرجّعه للسلة تعرض المشكلة
  if (cart.lines.length === 0 || cart.hasProblems) redirect("/cart");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <Link
        href="/cart"
        className="text-sm text-neutral-600 underline underline-offset-4"
      >
        ← Back to cart
      </Link>
      <h1 className="mb-8 mt-3 font-[family-name:var(--font-display)] text-4xl uppercase tracking-tight">
        Checkout
      </h1>
      <CheckoutForm
        addresses={addresses}
        lines={cart.lines}
        cardEnabled={getPaymobConfig() !== null}
      />
    </div>
  );
}