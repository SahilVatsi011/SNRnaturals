import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SNR Naturals — Pure Himalayan Goodness",
  description:
    "Fresh, natural products straight from Sundernagar, Himachal Pradesh. Honey, spices, cold-pressed oils and more — delivered to your door.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#fafaf8] text-stone-900">{children}</body>
    </html>
  );
}
