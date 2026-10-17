import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export default async function AdminLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    await requireAdmin();

    return (
        <div className="min-h-screen bg-neutral-50">
            <header className="border-b border-neutral-200 bg-white">
                <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
                    <div className="flex items-center gap-6">
                        <span className="font-(family-name:--font-display) text-lg uppercase">
                            Atelier Cairo · Admin
                        </span>
                        <nav className="flex gap-4 text-sm">
                            <Link href="/admin" className="hover:underline">
                                Dashboard
                            </Link>
                            <Link href="/admin/products" className="hover:underline">
                                Products
                            </Link>
                            <Link href="/admin/orders" className="hover:underline">
                                Orders
                            </Link>
                            <Link href="/admin/coupons" className="hover:underline">
                                Coupons
                            </Link>
                            <Link href="/admin/customers" className="hover:underline">
                                Customers
                            </Link>
                        </nav>
                    </div>
                    <Link href="/" className="text-sm underline underline-offset-4">
                        View store
                    </Link>
                </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">{children}</main>
        </div>
    );
}