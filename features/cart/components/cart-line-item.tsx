"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { formatPrice } from "@/lib/format";
import { removeCartItemAction, updateCartQuantityAction } from "../actions";
import type { CartLine } from "../queries";

export function CartLineItem({ line }: { line: CartLine }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function changeQuantity(next: number) {
    setError(null);
    startTransition(async () => {
      const result = await updateCartQuantityAction({
        itemId: line.id,
        quantity: next,
      });
      if (result?.error) setError(result.error);
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      const result = await removeCartItemAction(line.id);
      if (result?.error) setError(result.error);
    });
  }

  const canIncrease = line.quantity < line.maxQuantity;

  return (
    <li className="flex gap-4 border-b border-neutral-200 py-5">
      <div className="relative h-28 w-20 shrink-0 bg-neutral-200">
        {line.imageUrl && (
          <Image
            src={line.imageUrl}
            alt={line.productName}
            fill
            sizes="80px"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between gap-4">
          <div>
            {line.productSlug ? (
              <Link
                href={`/product/${line.productSlug}`}
                className="text-sm font-medium hover:underline"
              >
                {line.productName}
              </Link>
            ) : (
              <p className="text-sm font-medium">{line.productName}</p>
            )}
            {line.size && (
              <p className="mt-1 flex items-center gap-2 text-xs text-neutral-600">
                <span
                  className="h-3 w-3 rounded-full border border-neutral-300"
                  style={{ backgroundColor: line.colorHex }}
                  aria-hidden="true"
                />
                {line.color} / {line.size}
              </p>
            )}
          </div>
          {line.problem === null && (
            <p className="text-sm">{formatPrice(line.lineTotal)}</p>
          )}
        </div>

        {line.problem && (
          <p className="text-sm text-red-600" role="alert">
            {line.problem}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center border border-neutral-300">
            <button
              type="button"
              onClick={() => changeQuantity(line.quantity - 1)}
              disabled={pending || line.quantity <= 1}
              aria-label="Decrease quantity"
              className="h-8 w-8 disabled:text-neutral-300"
            >
              −
            </button>
            <span className="w-8 text-center text-sm" aria-live="polite">
              {line.quantity}
            </span>
            <button
              type="button"
              onClick={() => changeQuantity(line.quantity + 1)}
              disabled={pending || !canIncrease}
              aria-label="Increase quantity"
              className="h-8 w-8 disabled:text-neutral-300"
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={remove}
            disabled={pending}
            className="text-sm text-neutral-600 underline underline-offset-4"
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}