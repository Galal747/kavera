import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-display" });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  // أساس روابط صور المشاركة (Open Graph) النسبية
  metadataBase: new URL(siteUrl),
  title: "Atelier Cairo",
  description: "Egyptian streetwear, made with intention.",
  openGraph: {
    siteName: "Atelier Cairo",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${oswald.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}