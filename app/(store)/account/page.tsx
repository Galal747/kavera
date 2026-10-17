import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
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
        <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
            <h1 className="font-(family-name:--font-display) text-4xl uppercase tracking-tight">
                My account
            </h1>
            <p className="mt-4 text-neutral-700">
                {profile?.full_name ?? "Welcome"}
            </p>
            <p className="text-sm text-neutral-500">{user.email}</p>
            <nav className="mt-8 flex flex-col gap-2 text-sm">
                <Link href="/account/addresses" className="underline underline-offset-4">
                    Saved addresses
                </Link>
            </nav>
            <form action={logoutAction} className="mt-8">
                <Button type="submit" variant="outline">
                    Sign out
                </Button>
            </form>
        </div>
    );
}