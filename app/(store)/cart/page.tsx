import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button"; 
import { CartLineItem } from "@/features/cart/components/cart-line-item";
import { getCart } from "@/features/cart/queries";
import { requireUser } from "@/lib/auth";
import { formatPrice } from "@/lib/format";

export const metadata = { title: "Cart | Atelier Cairo" };

export default async function CartPage() {
    await requireUser("/cart");
    const cart = await getCart();

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-6">
            <h1 className="font-[family-name:var(--font-display)] text-4xl uppercase tracking-tight">
                Your cart
            </h1>

            {cart.lines.length === 0 ? (
                <div className="mt-16 text-center">
                    <p className="text-neutral-600">Your cart is empty.</p>
                    <Link href="/shop" className={buttonVariants({ className: "mt-6" })}>
                        Continue shopping
                    </Link>
                </div>
            ) : (
                <div className="mt-8 grid gap-10 md:grid-cols-[1fr_320px]">
                    <ul className="border-t border-neutral-200">
                        {cart.lines.map((line) => (
                            <CartLineItem key={line.id} line={line} />
                        ))}
                    </ul>

                    <aside className="h-fit space-y-4 border border-neutral-200 bg-white p-5">
                        <h2 className="text-sm font-medium uppercase tracking-widest">
                            Summary
                        </h2>
                        <div className="flex justify-between text-sm">
                            <span>
                                Subtotal ({cart.itemCount}{" "}
                                {cart.itemCount === 1 ? "item" : "items"})
                            </span>
                            <span>{formatPrice(cart.subtotal)}</span>
                        </div>
                        <p className="text-xs text-neutral-500">
                            Shipping and discounts are calculated at checkout.
                        </p>
                        {cart.hasProblems && (
                            <p className="text-sm text-red-600" role="alert">
                                Fix the items marked above before checking out.
                            </p>
                        )}
                        {cart.hasProblems ? (
                            <Button className="w-full" size="lg" disabled>
                                Checkout
                            </Button>
                        ) : (
                            <Link 
                                href="/checkout" 
                                className={buttonVariants({ className: "w-full", size: "lg" })}
                            >
                                Checkout
                            </Link>
                        )}
                    </aside>
                </div>
            )}
        </div>
    );
}