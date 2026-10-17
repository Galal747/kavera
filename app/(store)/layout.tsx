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
      <Navbar isLoggedIn={Boolean(user)} cartCount={cartCount} />
      <main>{children}</main>
      <Footer />
    </>
  );
}