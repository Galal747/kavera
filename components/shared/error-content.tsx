"use client";

import Link from "next/link";
import { useEffect } from "react";

type ErrorContentProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export function ErrorContent({ error, reset }: ErrorContentProps) {
  useEffect(() => {
    // التفاصيل الكاملة في logs السيرفر. هنا بنسجّل المرجع بس.
    console.error("Page error", error.digest ?? "");
  }, [error]);

  return (
    <div
      className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 py-16 text-center"
      role="alert"
    >
      <p className="text-xs uppercase tracking-[0.3em] text-neutral-500">Error</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-5xl uppercase tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-4 text-neutral-600">
        We couldn&apos;t load this page. Please try again, and if it keeps
        happening, contact us.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-neutral-400">Reference: {error.digest}</p>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="bg-neutral-950 px-5 py-2.5 text-sm text-white hover:bg-neutral-800"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-neutral-300 px-5 py-2.5 text-sm hover:border-neutral-950"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}