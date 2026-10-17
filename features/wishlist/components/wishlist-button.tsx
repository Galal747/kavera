"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { setWishlistAction } from "../actions";

type WishlistButtonProps = {
  productId: string;
  productName: string;
  initialWished: boolean;
  variant?: "overlay" | "inline";
};

export function WishlistButton({
  productId,
  productName,
  initialWished,
  variant = "overlay",
}: WishlistButtonProps) {
  const router = useRouter();
  const [wished, setOptimisticWished] = useOptimistic(
    initialWished,
    (_current, next: boolean) => next,
  );
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toggle() {
    const next = !wished;
    setError(null);

    startTransition(async () => {
      setOptimisticWished(next);
      const result = await setWishlistAction({ productId, wished: next });

      if (result?.needsLogin) {
        const here = window.location.pathname + window.location.search;
        router.push(`/login?next=${encodeURIComponent(here)}`);
        return;
      }
      if (result?.error) setError(result.error);
    });
  }

  const label = wished
    ? `Remove ${productName} from wishlist`
    : `Add ${productName} to wishlist`;

  const icon = (
    <Heart
      size={18}
      fill={wished ? "currentColor" : "none"}
      aria-hidden="true"
    />
  );

  if (variant === "inline") {
    return (
      <div>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={wished}
          aria-label={label}
          className="flex items-center gap-2 border border-neutral-300 px-4 py-2 text-sm transition-colors hover:border-neutral-950"
        >
          {icon}
          {wished ? "Saved to wishlist" : "Add to wishlist"}
        </button>
        {error && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={wished}
        aria-label={label}
        className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-neutral-950 transition-colors hover:bg-white"
      >
        {icon}
      </button>
      {error && (
        <span role="alert" className="sr-only">
          {error}
        </span>
      )}
    </>
  );
}