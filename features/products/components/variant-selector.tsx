"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { addToCartAction } from "@/features/cart/actions";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/product";

export function VariantSelector({ product }: { product: Product }) {
  const router = useRouter();
  
  // بندور على أول نسخة من المنتج (لون + مقاس) تكون متاحة في المخزن
  const defaultVariant = product.variants.find((v) => v.stock > 0);

  // بنحط القيم الافتراضية للون والمقاس بدل ما يبدأوا فاضيين (null)
  const [color, setColor] = useState<string | null>(
    defaultVariant?.colorHex ?? product.colors[0] ?? null
  );
  const [size, setSize] = useState<string | null>(
    defaultVariant?.size ?? product.sizes[0] ?? null
  );
  
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function findVariant(hex: string, sizeName: string) {
    return product.variants.find(
      (v) => v.colorHex === hex && v.size === sizeName,
    );
  }

  const selected = color && size ? findVariant(color, size) : undefined;
  const canAdd = Boolean(selected && selected.stock > 0) && !pending;

  function sizeAvailable(s: string) {
    if (color) return (findVariant(color, s)?.stock ?? 0) > 0;
    return product.variants.some((v) => v.size === s && v.stock > 0);
  }

  function pickColor(hex: string) {
    setColor(hex);
    setMessage(null);
    setError(null);
    // لو المقاس المختار مش متاح باللون الجديد نشيله
    if (size && (findVariant(hex, size)?.stock ?? 0) <= 0) setSize(null);
  }

  function pickSize(s: string) {
    setSize(s);
    setMessage(null);
    setError(null);
  }

  function handleAdd() {
    if (!selected) return;
    setMessage(null);
    setError(null);

    startTransition(async () => {
      // بنبعت variantId والكمية بس. السعر بيتحسب في السيرفر.
      const result = await addToCartAction({
        variantId: selected.id,
        quantity: 1,
      });

      if (result?.needsLogin) {
        router.push(
          `/login?next=${encodeURIComponent(`/product/${product.slug}`)}`,
        );
        return;
      }
      if (result?.error) setError(result.error);
      else setMessage("Added to your cart.");
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-3 text-xs uppercase tracking-widest text-neutral-500">
          Color
        </p>
        <div className="flex gap-3">
          {product.colors.map((hex) => (
            <button
              key={hex}
              type="button"
              onClick={() => pickColor(hex)}
              aria-label={`Color ${hex}`}
              aria-pressed={color === hex}
              className={`h-9 w-9 rounded-full border-2 transition-all ${
                color === hex
                  ? "border-neutral-950 ring-2 ring-neutral-950 ring-offset-2"
                  : "border-neutral-300"
              }`}
              style={{ backgroundColor: hex }}
            />
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-xs uppercase tracking-widest text-neutral-500">
          Size
        </p>
        <div className="flex flex-wrap gap-2">
          {product.sizes.map((s) => {
            const available = sizeAvailable(s);
            return (
              <button
                key={s}
                type="button"
                disabled={!available}
                onClick={() => pickSize(s)}
                aria-pressed={size === s}
                className={`min-w-12 border px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:text-neutral-300 disabled:line-through ${
                  size === s
                    ? "border-neutral-950 bg-neutral-950 text-white"
                    : "border-neutral-300 hover:border-neutral-950"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {selected && selected.price !== product.price && (
        <p className="text-sm text-neutral-700">
          Price for this option: {formatPrice(selected.price)}
        </p>
      )}
      {selected && selected.stock > 0 && selected.stock <= 5 && (
        <p className="text-sm text-amber-700">Only {selected.stock} left.</p>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={!product.inStock || !canAdd}
        onClick={handleAdd}
      >
        {!product.inStock
          ? "Sold out"
          : pending
            ? "Adding..."
            : "Add to cart"}
      </Button>

      {product.inStock && !selected && (
        <p className="text-xs text-neutral-500">
          Select a color and a size to continue.
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="text-sm text-emerald-700" role="status">
          {message}{" "}
          <Link href="/cart" className="underline underline-offset-4">
            View cart
          </Link>
        </p>
      )}
    </div>
  );
}