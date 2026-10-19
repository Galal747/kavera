import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";
import { createClient } from "@/lib/supabase/server";

export default async function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let cartCount = 0;
  if (user) {
    const { data } = await supabase.from("cart_items").select("quantity");
    cartCount = (data ?? []).reduce((sum, row) => sum + row.quantity, 0);
  }

  return (
        <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:text-neutral-950"
      >
        Skip to content
      </a>
      <Navbar isLoggedIn={Boolean(user)} cartCount={cartCount} />
      <main id="main-content">{children}</main>
      <Footer />
    </>
  );
}