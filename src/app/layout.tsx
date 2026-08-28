import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SNR Naturals — Sundernagar Naturals",
  description: "Prepaid online store for Sundernagar Naturals, Sundernagar, Mandi (HP).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
