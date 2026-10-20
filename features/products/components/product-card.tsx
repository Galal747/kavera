import Image from "next/image";
import Link from "next/link";
import { WishlistButton } from "@/features/wishlist/components/wishlist-button";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/product";

const CARD_SIZES = "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw";

type ProductCardProps = {
  product: Product;
  wished?: boolean;
};

export function ProductCard({ product, wished = false }: ProductCardProps) {
  const [mainImage, hoverImage] = product.images;

  return (
    <div className="group relative flex h-full flex-col rounded-xl bg-white p-2 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.12)] sm:p-3">
      <Link
        href={`/product/${product.slug}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950"
      >
        <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-neutral-200">
          {mainImage ? (
            <>
              <Image
                src={mainImage}
                alt={product.name}
                fill
                sizes={CARD_SIZES}
                className="object-cover"
              />
              {hoverImage && (
                <Image
                  src={hoverImage}
                  alt=""
                  aria-hidden="true"
                  fill
                  sizes={CARD_SIZES}
                  className="object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                />
              )}
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-sm uppercase tracking-widest text-neutral-400">
              No image
            </div>
          )}

          {product.isNew && (
            <span className="absolute left-3 top-3 z-10 rounded bg-neutral-950 px-2 py-1 text-xs uppercase tracking-wider text-white">
              New
            </span>
          )}
          {!product.inStock && (
            <span className="absolute bottom-3 left-3 z-10 rounded bg-white px-2 py-1 text-xs uppercase tracking-wider text-neutral-950">
              Sold out
            </span>
          )}
        </div>

        <div className="mt-4 space-y-1 px-1">
          <h3 className="text-sm font-medium text-neutral-950">
            {product.name}
          </h3>
          <p className="text-sm text-neutral-600">
            {formatPrice(product.price)}
          </p>
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

      {/* زرار المفضلة: مخفي في الديسكتوب وبيظهر مع الهوفر، وظاهر دايماً في الموبايل */}
      <div className="absolute right-4 top-4 z-20 transition-opacity duration-300 md:opacity-0 md:group-hover:opacity-100">
        <WishlistButton
          productId={product.id}
          productName={product.name}
          initialWished={wished}
        />
      </div>
    </div>
  );
}