import Link from "next/link";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/product";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950"
    >
      {/* مكان الصورة: placeholder لحد ما نرفع صور حقيقية */}
      <div className="relative aspect-3/4 overflow-hidden bg-neutral-200">
        <div className="absolute inset-0 flex items-center justify-center text-sm uppercase tracking-widest text-neutral-400 transition-transform duration-500 group-hover:scale-105">
          Image
        </div>

        {product.isNew && (
          <span className="absolute left-3 top-3 bg-neutral-950 px-2 py-1 text-xs uppercase tracking-wider text-white">
            New
          </span>
        )}
        {!product.inStock && (
          <span className="absolute right-3 top-3 bg-white px-2 py-1 text-xs uppercase tracking-wider text-neutral-950">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-medium text-neutral-950">{product.name}</h3>
        <p className="text-sm text-neutral-600">{formatPrice(product.price)}</p>
        <div className="flex gap-1.5 pt-1">
          {product.colors.map((hex) => (
            <span
              key={hex}
              className="h-3 w-3 rounded-full border border-neutral-300"
              style={{ backgroundColor: hex }}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>
    </Link>
  );
}