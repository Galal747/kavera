"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { Product } from "@/types/product";

export function VariantSelector({ product }: { product: Product }) {
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canAdd = product.inStock && color !== null && size !== null;

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
              onClick={() => setColor(hex)}
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
          {product.sizes.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSize(s)}
              aria-pressed={size === s}
              className={`min-w-12 border px-4 py-2 text-sm transition-colors ${
                size === s
                  ? "border-neutral-950 bg-neutral-950 text-white"
                  : "border-neutral-300 hover:border-neutral-950"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!canAdd}
        onClick={() =>
          setMessage("Cart is coming in a later milestone. Selection saved!")
        }
      >
        {product.inStock ? "Add to cart" : "Sold out"}
      </Button>

      {product.inStock && !canAdd && (
        <p className="text-xs text-neutral-500">
          Select a color and a size to continue.
        </p>
      )}
      {message && <p className="text-sm text-emerald-700">{message}</p>}
    </div>
  );
}