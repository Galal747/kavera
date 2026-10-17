import Link from "next/link";

type PaginationProps = {
  page: number;
  totalPages: number;
  buildHref: (page: number) => string;
};

export function Pagination({ page, totalPages, buildHref }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav
      aria-label="Pagination"
      className="mt-12 flex items-center justify-center gap-2"
    >
      {page > 1 && (
        <Link
          href={buildHref(page - 1)}
          className="border border-neutral-300 px-3 py-2 text-sm hover:border-neutral-950"
        >
          Previous
        </Link>
      )}

      {pages.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={`min-w-10 border px-3 py-2 text-center text-sm ${
            p === page
              ? "border-neutral-950 bg-neutral-950 text-white"
              : "border-neutral-300 hover:border-neutral-950"
          }`}
        >
          {p}
        </Link>
      ))}

      {page < totalPages && (
        <Link
          href={buildHref(page + 1)}
          className="border border-neutral-300 px-3 py-2 text-sm hover:border-neutral-950"
        >
          Next
        </Link>
      )}
    </nav>
  );
}