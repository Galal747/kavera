import Link from "next/link";
import { AddressesManager } from "@/features/addresses/components/addresses-manager";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Addresses | Atelier Cairo" };

export default async function AddressesPage() {
  await requireUser("/account/addresses");

  // الـ RLS بترجّع عناوين المستخدم الحالي بس
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("addresses")
    .select("id, full_name, phone, governorate, city, street, notes, is_default")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const addresses = (data ?? []).map((a) => ({
    id: a.id,
    fullName: a.full_name,
    phone: a.phone,
    governorate: a.governorate,
    city: a.city,
    street: a.street,
    notes: a.notes,
    isDefault: a.is_default,
  }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <Link
        href="/account"
        className="text-sm text-neutral-600 underline underline-offset-4"
      >
        ← Back to account
      </Link>
      <h1 className="mb-8 mt-3 font-[family-name:var(--font-display)] text-4xl uppercase tracking-tight">
        Addresses
      </h1>
      <AddressesManager addresses={addresses} />
    </div>
  );
}