import type { Metadata } from "next";
import { Inter, Oswald } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const oswald = Oswald({ subsets: ["latin"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "Atelier Cairo",
  description: "Egyptian streetwear, made with intention.",
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