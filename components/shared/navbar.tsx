"use client";

import Link from "next/link";
import { useState } from "react";
import { Heart, Menu, ShoppingBag, User, X } from "lucide-react";

const links = [
    { href: "/shop", label: "Shop" },
    { href: "/shop?category=oversized", label: "Oversized" },
    { href: "/shop?category=hoodies", label: "Hoodies" },
    { href: "/shop?category=accessories", label: "Accessories" },
];

type NavbarProps = {
    isLoggedIn: boolean;
    cartCount: number;
};

export function Navbar({ isLoggedIn, cartCount }: NavbarProps) {
    const [open, setOpen] = useState(false);

    return (
        <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/90 backdrop-blur">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 md:px-6">
                <button
                    className="md:hidden"
                    onClick={() => setOpen((v) => !v)}
                    aria-label={open ? "Close menu" : "Open menu"}
                    aria-expanded={open}
                >
                    {open ? <X size={22} /> : <Menu size={22} />}
                </button>

                <Link
                    href="/"
                    className="font-[family-name:var(--font-display)] text-xl uppercase tracking-tight"
                >
                    Atelier Cairo
                </Link>

                <ul className="hidden items-center gap-8 md:flex">
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

                        <div className="flex items-center gap-4">
          <Link href="/wishlist" aria-label="Wishlist">
            <Heart size={20} />
          </Link>
          <Link
            href={isLoggedIn ? "/account" : "/login"}
            aria-label={isLoggedIn ? "Account" : "Sign in"}
            className="hidden md:block"
          >
            <User size={20} />
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart, ${cartCount} ${cartCount === 1 ? "item" : "items"}`}
            className="relative"
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

            {open && (
                <ul className="border-t border-neutral-200 bg-white px-4 py-4 md:hidden">
                    {links.map((l) => (
                        <li key={l.href}>
                            <Link
                                href={l.href}
                                onClick={() => setOpen(false)}
                                className="block py-3 text-sm uppercase tracking-wider"
                            >
                                {l.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </header>
    );
}