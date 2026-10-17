"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PRODUCT_CATEGORIES } from "@/types/product";

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];

export function ShopControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get("category");

  function update(changes: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page"); // أي تغيير في الفلتر يرجّعنا للصفحة الأولى
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function onSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const q = String(data.get("q") ?? "").trim();
    update({ q: q || null });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row">
        <form onSubmit={onSearch} className="flex flex-1 gap-2" role="search">
          <Input
            name="q"
            type="search"
            placeholder="Search products..."
            aria-label="Search products"
            defaultValue={searchParams.get("q") ?? ""}
            maxLength={100}
          />
          <Button type="submit">Search</Button>
        </form>

        <select
          aria-label="Sort products"
          value={searchParams.get("sort") ?? "newest"}
          onChange={(e) => update({ sort: e.target.value })}
          className="h-9 border border-neutral-300 bg-white px-3 text-sm"
        >
          {sortOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => update({ category: null })}
          aria-pressed={!activeCategory}
          className={`border px-3 py-1.5 text-xs uppercase tracking-wider ${
            !activeCategory
              ? "border-neutral-950 bg-neutral-950 text-white"
              : "border-neutral-300 hover:border-neutral-950"
          }`}
        >
          All
        </button>
        {PRODUCT_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => update({ category: c })}
            aria-pressed={activeCategory === c}
            className={`border px-3 py-1.5 text-xs uppercase tracking-wider ${
              activeCategory === c
                ? "border-neutral-950 bg-neutral-950 text-white"
                : "border-neutral-300 hover:border-neutral-950"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}