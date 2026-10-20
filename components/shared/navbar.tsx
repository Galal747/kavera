"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Heart, LogOut, Menu, ShoppingBag, User, X } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { logoutAction } from "@/features/auth/actions";
import { logoutAction as serverLogoutAction } from "@/features/auth/actions";
const links = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
    { href: "/shop?gender=men", label: "Men" },
    { href: "/shop?gender=women", label: "Women" },
    { href: "/shop?category=oversized", label: "Oversized" },
    { href: "/shop?category=hoodies", label: "Hoodies" },
    { href: "/shop?category=accessories", label: "Accessories" },
];

type NavbarProps = {
    isLoggedIn: boolean;
    cartCount: number;
    // Server Action لتسجيل الخروج (اختياري). لو مش متبعتة بيتنفذ الكود المؤقت تحت
    logoutAction?: () => Promise<void>;
};

export function Navbar({ isLoggedIn, cartCount, logoutAction }: NavbarProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pending, startTransition] = useTransition();

    // قفل اسكرول الصفحة لما القائمة أو نافذة التأكيد مفتوحة
    useEffect(() => {
        document.body.style.overflow = open || confirmOpen ? "hidden" : "";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open, confirmOpen]);

    // Esc يقفل أي نافذة مفتوحة
    useEffect(() => {
        if (!open && !confirmOpen) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (confirmOpen) {
                if (!pending) setConfirmOpen(false);
            } else {
                setOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, confirmOpen, pending]);

    // أي زرار "Log out" بيفتح نافذة التأكيد بس
    const askLogout = () => {
        setOpen(false);
        setConfirmOpen(true);
    };

    // التنفيذ الفعلي بعد ما العميل يأكد
const confirmLogout = () => {
        startTransition(async () => {
            if (logoutAction) {
                await logoutAction(); // لو الدالة مبعوتة من ملف الـ Layout
            } else {
                await serverLogoutAction(); // الدالة اللي استوردناها من ملف الـ actions
            }
            setConfirmOpen(false);
        });
    };

    return (
        <>
            <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
                <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
                    <button
                        type="button"
                        className="-ml-2 p-2 md:hidden"
                        onClick={() => setOpen(true)}
                        aria-label="Open menu"
                        aria-expanded={open}
                    >
                        <Menu size={22} />
                    </button>

                    <Link href="/" className="flex shrink-0 items-center">
                        <Image
                            src={BRAND.logo.src}
                            alt={BRAND.logo.alt}
                            width={BRAND.logo.width}
                            height={BRAND.logo.height}
                            priority
                            className="h-6 w-auto sm:h-7 md:h-8"
                        />
                    </Link>

                    <ul className="hidden items-center gap-6 md:flex lg:gap-8">
                        {links.map((l) => (
                            <li key={l.href}>
                                <Link
                                    href={l.href}
                                    className="text-sm uppercase tracking-wider text-neutral-700 transition-colors hover:text-neutral-950"
                                >
                                    {l.label}
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="flex items-center gap-3 sm:gap-4">
                        <Link
                            href="/wishlist"
                            aria-label="Wishlist"
                            className="transition-colors hover:text-neutral-500"
                        >
                            <Heart size={20} />
                        </Link>

                        <Link
                            href={isLoggedIn ? "/account" : "/login"}
                            aria-label={isLoggedIn ? "Account" : "Sign in"}
                            className="hidden transition-colors hover:text-neutral-500 md:block"
                        >
                            <User size={20} />
                        </Link>

                        {isLoggedIn && (
                            <button
                                type="button"
                                onClick={askLogout}
                                aria-label="Log out"
                                className="hidden text-neutral-400 transition-colors hover:text-red-600 md:block"
                            >
                                <LogOut size={20} />
                            </button>
                        )}

                        <Link
                            href="/cart"
                            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
                            className="relative transition-colors hover:text-neutral-500"
                        >
                            <ShoppingBag size={20} />
                            {cartCount > 0 && (
                                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-950 px-1 text-[10px] text-white">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-50 bg-neutral-900/60 backdrop-blur-sm transition-opacity duration-300 md:hidden ${open ? "opacity-100" : "pointer-events-none opacity-0"
                    }`}
                onClick={() => setOpen(false)}
                aria-hidden="true"
            />

            {/* Drawer */}
            <div
                className={`fixed left-0 top-0 z-[60] flex h-[100dvh] w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out md:hidden ${open ? "translate-x-0" : "-translate-x-full"
                    }`}
                role="dialog"
                aria-modal="true"
                aria-label="Menu"
                aria-hidden={!open}
                inert={!open}            >
                <div className="flex h-16 shrink-0 items-center justify-between border-b border-neutral-100 px-4">
                    <Link
                        href="/"
                        className="flex shrink-0 items-center"
                        onClick={() => setOpen(false)}
                    >
                        <Image
                            src={BRAND.logo.src}
                            alt={BRAND.logo.alt}
                            width={BRAND.logo.width}
                            height={BRAND.logo.height}
                            className="h-6 w-auto"
                        />
                    </Link>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="p-2 text-neutral-400 transition-colors hover:text-neutral-900"
                        aria-label="Close menu"
                    >
                        <X size={22} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-8">
                    <ul className="flex flex-col gap-6">
                        {links.map((l) => (
                            <li key={l.href}>
                                <Link
                                    href={l.href}
                                    onClick={() => setOpen(false)}
                                    className="block text-lg font-medium uppercase tracking-wider text-neutral-800 transition-colors hover:text-neutral-500"
                                >
                                    {l.label}
                                </Link>
                            </li>
                        ))}

                        <li className="mt-4 border-t border-neutral-100 pt-6">
                            <Link
                                href={isLoggedIn ? "/account" : "/login"}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-4 text-lg font-medium uppercase tracking-wider text-neutral-800 transition-colors hover:text-neutral-500"
                            >
                                <User size={22} strokeWidth={1.5} />
                                {isLoggedIn ? "My Account" : "Sign in"}
                            </Link>
                        </li>

                        {isLoggedIn && (
                            <li className="mt-2">
                                <button
                                    type="button"
                                    onClick={askLogout}
                                    className="flex w-full items-center gap-4 text-lg font-medium uppercase tracking-wider text-red-500 transition-colors hover:text-red-700"
                                >
                                    <LogOut size={22} strokeWidth={1.5} />
                                    Log out
                                </button>
                            </li>
                        )}
                    </ul>
                </div>
            </div>

            {/* نافذة تأكيد تسجيل الخروج */}
            {confirmOpen && (
                <div
                    className="fixed inset-0 z-[70] flex items-center justify-center p-4"
                    role="alertdialog"
                    aria-modal="true"
                    aria-labelledby="logout-title"
                    aria-describedby="logout-desc"
                >
                    <div
                        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
                        onClick={() => !pending && setConfirmOpen(false)}
                        aria-hidden="true"
                    />

                    <div className="relative w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl sm:p-8">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                            <LogOut size={22} />
                        </div>

                        <h2
                            id="logout-title"
                            className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-tight"
                        >
                            Log out?
                        </h2>
                        <p id="logout-desc" className="mt-2 text-sm text-neutral-500">
                            Are you sure you want to log out of your account?
                        </p>

                        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
                            <button
                                type="button"
                                autoFocus
                                disabled={pending}
                                onClick={() => setConfirmOpen(false)}
                                className="flex-1 rounded-lg border border-neutral-300 px-4 py-2.5 text-sm font-medium uppercase tracking-wider text-neutral-800 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={pending}
                                onClick={confirmLogout}
                                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium uppercase tracking-wider text-white transition-colors hover:bg-red-700 disabled:opacity-60"
                            >
                                {pending ? "Logging out..." : "Log out"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}