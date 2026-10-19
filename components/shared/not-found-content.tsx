import Link from "next/link";

export function NotFoundContent() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">404</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl uppercase tracking-tight">
        Page not found
      </h1>
      <p className="mt-4 text-neutral-600">
        The page you&apos;re looking for doesn&apos;t exist or has moved.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="bg-neutral-950 px-5 py-2.5 text-sm text-white hover:bg-neutral-800"
        >
          Back to home
        </Link>
        <Link
          href="/shop"
          className="border border-neutral-300 px-5 py-2.5 text-sm hover:border-neutral-950"
        >
          Browse the shop
        </Link>
      </div>
    </div>
  );
}