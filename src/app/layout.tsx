import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { NavProgress } from "@/components/ui/NavProgress";

export const metadata: Metadata = {
  title: "SNR Naturals — Pure Himalayan Goodness",
  description:
    "Fresh, natural products straight from Sundernagar, Himachal Pradesh. Honey, spices, cold-pressed oils and more — delivered to your door.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900">
        <Suspense fallback={null}>
          <NavProgress />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
