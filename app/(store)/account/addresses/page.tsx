import Link from "next/link";
import { AddressesManager } from "@/features/addresses/components/addresses-manager";
import { getAddresses } from "@/features/addresses/queries";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Addresses | Atelier Cairo" };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await getAddresses(user.id);

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