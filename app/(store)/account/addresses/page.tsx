import Link from "next/link";
import { AddressesManager } from "@/features/addresses/components/addresses-manager";
import { getAddresses } from "@/features/addresses/queries";
import { requireUser } from "@/lib/auth";
import { FadeIn } from "@/components/shared/fade-in";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await getAddresses(user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <FadeIn>
        <Link
          href="/account"
          className="text-sm text-neutral-600 underline underline-offset-4 transition-colors hover:text-neutral-900"
        >
          ← Back to account
        </Link>
        <h1 className="mb-8 mt-3 font-[family-name:var(--font-display)] text-4xl uppercase tracking-tight">
          Saved Addresses
        </h1>
      </FadeIn>

      <FadeIn delay={0.15}>
        {/* المكون ده هو اللي جواه تصميم كروت العناوين */}
        <AddressesManager addresses={addresses} />
      </FadeIn>
    </div>
  );
}