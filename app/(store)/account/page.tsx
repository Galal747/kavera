import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { FadeIn } from "@/components/shared/fade-in";
import { Package, MapPin, LogOut, User } from "lucide-react";

export default async function AccountPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    
    if (!user) redirect("/login?next=/account");

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

    return (
        <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
            {/* الهيدر: بيانات المستخدم بشكل فخم */}
            <FadeIn>
                <div className="mb-10 flex items-center gap-5 border-b border-neutral-200 pb-8">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 shadow-sm">
                        <User size={28} strokeWidth={1.5} />
                    </div>
                    <div>
                        <h1 className="font-[family-name:var(--font-display)] text-3xl uppercase tracking-tight md:text-4xl">
                            {profile?.full_name ?? "My Account"}
                        </h1>
                        <p className="mt-1 text-sm text-neutral-500 md:text-base">
                            {user.email}
                        </p>
                    </div>
                </div>
            </FadeIn>

            {/* شبكة الكروت (Dashboard) */}
            <div className="grid gap-4 sm:grid-cols-2">
                <FadeIn delay={0.1}>
                    <Link 
                        href="/account/orders" 
                        className="group flex h-full items-start gap-4 rounded-sm border border-neutral-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-900 hover:shadow-md"
                    >
                        <div className="flex rounded-full bg-neutral-100 p-3 text-neutral-600 transition-colors group-hover:bg-neutral-900 group-hover:text-white">
                            <Package size={22} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-lg font-medium uppercase tracking-wide">
                                My Orders
                            </h2>
                            <p className="mt-1 text-sm text-neutral-500">
                                View, track, or buy your previous orders again.
                            </p>
                        </div>
                    </Link>
                </FadeIn>

                <FadeIn delay={0.15}>
                    <Link 
                        href="/account/addresses" 
                        className="group flex h-full items-start gap-4 rounded-sm border border-neutral-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-neutral-900 hover:shadow-md"
                    >
                        <div className="flex rounded-full bg-neutral-100 p-3 text-neutral-600 transition-colors group-hover:bg-neutral-900 group-hover:text-white">
                            <MapPin size={22} strokeWidth={1.5} />
                        </div>
                        <div>
                            <h2 className="text-lg font-medium uppercase tracking-wide">
                                Saved Addresses
                            </h2>
                            <p className="mt-1 text-sm text-neutral-500">
                                Manage your delivery locations and defaults.
                            </p>
                        </div>
                    </Link>
                </FadeIn>
            </div>

            {/* زرار تسجيل الخروج */}
            <FadeIn delay={0.25}>
                <form action={logoutAction} className="mt-12">
                    <Button 
                        type="submit" 
                        variant="outline" 
                        className="flex h-12 items-center gap-2 px-8 text-neutral-600 hover:bg-neutral-100 hover:text-red-600"
                    >
                        <LogOut size={18} strokeWidth={1.5} />
                        Sign out
                    </Button>
                </form>
            </FadeIn>
        </div>
    );
}