import { Footer } from "@/components/shared/footer";
import { Navbar } from "@/components/shared/navbar";


export default function StoreLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
    </>
  );
}