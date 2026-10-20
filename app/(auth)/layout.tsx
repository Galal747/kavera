import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4 py-10">
      <Link
        href="/"
        className="mb-8 font-(family-name:--font-display) text-2xl uppercase tracking-tight"
      >
        {BRAND.name}
      </Link>
      <div className="w-full max-w-sm border border-neutral-200 bg-white p-6">
        {children}
      </div>
    </div>
  );
}