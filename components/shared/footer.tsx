import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 bg-neutral-950 text-neutral-300">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-3 md:px-6">
        <div>
          <p className="font-[family-name:var(--font-display)] text-2xl uppercase text-white">
            Atelier Cairo
          </p>
          <p className="mt-3 max-w-xs text-sm text-neutral-400">
            Streetwear built in Egypt, made with intention.
          </p>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-neutral-500">
            Shop
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/shop" className="hover:text-white">
                All products
              </Link>
            </li>
            <li>
              <Link href="/shop?category=hoodies" className="hover:text-white">
                Hoodies
              </Link>
            </li>
            <li>
              <Link href="/shop?category=oversized" className="hover:text-white">
                Oversized tees
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-neutral-500">
            Help
          </p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/account" className="hover:text-white">
                My account
              </Link>
            </li>
            <li>
              <Link href="/account/orders" className="hover:text-white">
                Order tracking
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-800 py-5 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} Atelier Cairo. A fictional brand for
        portfolio purposes.
      </div>
    </footer>
  );
}