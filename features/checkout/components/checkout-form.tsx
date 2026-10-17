"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AddressForm,
  type AddressRow,
} from "@/features/addresses/components/address-form";
import type { CartLine } from "@/features/cart/queries";
import { formatPrice } from "@/lib/format";
import { placeOrderAction, previewOrderAction, type Quote } from "../actions";

const MAX_ADDRESSES = 5;

type PreviewState = {
  key: string; // العنوان + الكوبون اللي الحساب ده اتعمل ليهم
  quote: Quote | null;
  error: string | null;
};

type CheckoutFormProps = {
  addresses: AddressRow[];
  lines: CartLine[];
};

export function CheckoutForm({ addresses, lines }: CheckoutFormProps) {
  const router = useRouter();

  const [chosenId, setChosenId] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [placing, startPlacing] = useTransition();
  const idempotencyKeyRef = useRef<string | null>(null);

  // العنوان المختار: اللي اخترته لو لسه موجود، وإلا الافتراضي، وإلا أول واحد
  const selectedId = addresses.some((a) => a.id === chosenId)
    ? chosenId
    : (addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? "");

  const currentKey = `${selectedId}|${appliedCode}`;
  const current = preview?.key === currentKey ? preview : null;
  const quote = current?.quote ?? null;
  const quoteError = current?.error ?? null;
  const loading = selectedId !== "" && current === null;

  // نجيب الحساب من السيرفر كل ما العنوان أو الكوبون يتغيّر
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    const key = `${selectedId}|${appliedCode}`;

    previewOrderAction({ addressId: selectedId, couponCode: appliedCode })
      .then((result) => {
        if (cancelled) return;
        if ("quote" in result) {
          setPreview({ key, quote: result.quote, error: null });
          return;
        }
        if (result.field === "coupon") {
          // الكوبون مرفوض: نشيله ونعرض السبب، والـ effect هيجيب الحساب من غيره
          setCouponError(result.error);
          setAppliedCode("");
          return;
        }
        setPreview({ key, quote: null, error: result.error });
      })
      .catch(() => {
        if (cancelled) return;
        setPreview({
          key,
          quote: null,
          error: "Could not calculate your total. Please try again.",
        });
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, appliedCode]);

  function applyCoupon() {
    setCouponError(null);
    setAppliedCode(couponInput.trim().toUpperCase());
  }

  function removeCoupon() {
    setCouponError(null);
    setCouponInput("");
    setAppliedCode("");
  }

  function placeOrder() {
    if (!selectedId || !quote) return;
    setPlaceError(null);

    // المفتاح بيتعمل مرة واحدة، وبيفضل ثابت لو حاولت تاني بعد فشل أو انقطاع
    idempotencyKeyRef.current ??= crypto.randomUUID();
    const idempotencyKey = idempotencyKeyRef.current;

    startPlacing(async () => {
      const result = await placeOrderAction({
        idempotencyKey,
        addressId: selectedId,
        couponCode: appliedCode,
        paymentMethod: "cod",
      });

      if (result?.needsLogin) {
        router.push("/login?next=/checkout");
        return;
      }
      // لو نجح، الـ action بتحوّلنا لصفحة الطلب
      if (result?.error) setPlaceError(result.error);
    });
  }

  // أول مرة: مفيش عناوين، فنعرض فورم العنوان مباشرة
  if (addresses.length === 0) {
    return (
      <div className="max-w-2xl space-y-4">
        <p className="text-sm text-neutral-600">
          Add a shipping address to continue.
        </p>
        <AddressForm
          showDefaultOption={false}
          onDone={() => router.refresh()}
          onCancel={() => router.push("/cart")}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_380px]">
      <div className="space-y-10">
        <section className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase">
            Shipping address
          </h2>

          <fieldset className="space-y-3">
            <legend className="sr-only">Choose a shipping address</legend>
            {addresses.map((a) => (
              <label
                key={a.id}
                className={`flex cursor-pointer gap-3 border p-4 text-sm ${
                  selectedId === a.id
                    ? "border-neutral-950"
                    : "border-neutral-200"
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  value={a.id}
                  checked={selectedId === a.id}
                  onChange={() => setChosenId(a.id)}
                  className="mt-1"
                />
                <span className="space-y-0.5">
                  <span className="block font-medium">{a.fullName}</span>
                  <span className="block text-neutral-700">{a.street}</span>
                  {a.notes && (
                    <span className="block text-neutral-600">{a.notes}</span>
                  )}
                  <span className="block text-neutral-700">
                    {a.city}, {a.governorate}
                  </span>
                  <span className="block text-neutral-600">{a.phone}</span>
                </span>
              </label>
            ))}
          </fieldset>

          {addingAddress ? (
            <AddressForm
              showDefaultOption
              onDone={() => {
                setAddingAddress(false);
                router.refresh();
              }}
              onCancel={() => setAddingAddress(false)}
            />
          ) : (
            <div className="flex items-center gap-4 text-sm">
              {addresses.length < MAX_ADDRESSES && (
                <button
                  type="button"
                  onClick={() => setAddingAddress(true)}
                  className="underline underline-offset-4"
                >
                  Add a new address
                </button>
              )}
              <Link
                href="/account/addresses"
                className="text-neutral-600 underline underline-offset-4"
              >
                Manage addresses
              </Link>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="font-[family-name:var(--font-display)] text-2xl uppercase">
            Payment
          </h2>
          <div className="space-y-3">
            <label className="flex gap-3 border border-neutral-950 p-4 text-sm">
              <input type="radio" name="payment" checked readOnly className="mt-1" />
              <span>
                <span className="block font-medium">Cash on delivery</span>
                <span className="block text-neutral-600">
                  Pay in cash when your order arrives.
                </span>
              </span>
            </label>
            <label className="flex gap-3 border border-neutral-200 p-4 text-sm text-neutral-400">
              <input type="radio" name="payment" disabled className="mt-1" />
              <span>
                <span className="block font-medium">Card payment</span>
                <span className="block">Coming soon.</span>
              </span>
            </label>
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-5 border border-neutral-200 bg-white p-5">
        <h2 className="text-sm font-medium uppercase tracking-widest">
          Order summary
        </h2>

        <ul className="space-y-3">
          {lines.map((line) => (
            <li key={line.id} className="flex gap-3 text-sm">
              <div className="relative h-16 w-12 shrink-0 bg-neutral-200">
                {line.imageUrl && (
                  <Image
                    src={line.imageUrl}
                    alt={line.productName}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{line.productName}</p>
                <p className="text-xs text-neutral-600">
                  {line.color} / {line.size} × {line.quantity}
                </p>
              </div>
              <p>{formatPrice(line.lineTotal)}</p>
            </li>
          ))}
        </ul>

        <div className="space-y-2 border-t border-neutral-200 pt-4">
          <Label htmlFor="coupon">Coupon code</Label>
          {appliedCode ? (
            <div className="flex items-center justify-between text-sm">
              <span>
                {appliedCode} {quote?.couponCode ? "applied" : "(checking...)"}
              </span>
              <button
                type="button"
                onClick={removeCoupon}
                className="underline underline-offset-4"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                id="coupon"
                value={couponInput}
                maxLength={30}
                autoCapitalize="characters"
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              />
              <Button
                type="button"
                variant="outline"
                onClick={applyCoupon}
                disabled={!couponInput.trim() || loading}
              >
                Apply
              </Button>
            </div>
          )}
          {couponError && (
            <p className="text-sm text-red-600" role="alert">
              {couponError}
            </p>
          )}
        </div>

        <dl className="space-y-2 border-t border-neutral-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{quote ? formatPrice(quote.subtotal) : "—"}</dd>
          </div>
          {quote && quote.discount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <dt>
                Discount{quote.couponCode ? ` (${quote.couponCode})` : ""}
              </dt>
              <dd>−{formatPrice(quote.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>
              {quote
                ? quote.shippingFee === 0
                  ? "Free"
                  : formatPrice(quote.shippingFee)
                : "—"}
            </dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-3 text-base font-medium">
            <dt>Total</dt>
            <dd>{quote ? formatPrice(quote.total) : "—"}</dd>
          </div>
        </dl>

        {loading && (
          <p className="text-xs text-neutral-500" role="status">
            Calculating your total...
          </p>
        )}
        {quoteError && (
          <p className="text-sm text-red-600" role="alert">
            {quoteError}{" "}
            <Link href="/cart" className="underline underline-offset-4">
              Back to cart
            </Link>
          </p>
        )}
        {placeError && (
          <p className="text-sm text-red-600" role="alert">
            {placeError}{" "}
            <Link href="/cart" className="underline underline-offset-4">
              Review cart
            </Link>
          </p>
        )}

        <Button
          type="button"
          size="lg"
          className="w-full"
          onClick={placeOrder}
          disabled={placing || loading || !quote || !selectedId}
        >
          {placing
            ? "Placing order..."
            : quote
              ? `Place order · ${formatPrice(quote.total)}`
              : "Place order"}
        </Button>
        <p className="text-xs text-neutral-500">
          You&apos;ll pay in cash on delivery. The final total is confirmed by
          our server when the order is placed.
        </p>
      </aside>
    </div>
  );
}