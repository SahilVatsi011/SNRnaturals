import Link from "next/link";
import { StoreHeader } from "@/components/store/StoreHeader";
import { STORE } from "@/lib/constants";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <StoreHeader />
      <main className="flex-1">{children}</main>

      {/* ━━━ Footer ━━━ */}
      <footer className="border-t border-gray-200 bg-gray-50 text-gray-600">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">
                  S
                </span>
                <span className="text-base font-bold text-gray-900">{STORE.name}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">
                Bringing you the finest natural products from the Himalayan
                valleys of Sundernagar, Mandi district.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Quick Links
              </h3>
              <ul className="space-y-2 text-sm">
                {[
                  { href: "/", label: "Shop All" },
                  { href: "/cart", label: "Cart" },
                  { href: "/order-history", label: "Track Order" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-gray-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                Contact
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="mt-0.5 shrink-0 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{STORE.city}, {STORE.district},<br />{STORE.state}</span>
                </li>
                {STORE.phone && (
                  <li className="flex items-center gap-2">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="shrink-0 text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${STORE.phone}`} className="transition-colors hover:text-gray-900">{STORE.phone}</a>
                  </li>
                )}
                <li className="flex items-center gap-2">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="shrink-0 text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span>{STORE.domain}</span>
                </li>
              </ul>
            </div>

            {/* Payments */}
            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                We Accept
              </h3>
              <div className="flex flex-wrap gap-2">
                {["UPI", "Visa / MC", "Net Banking"].map((m) => (
                  <span key={m} className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500">
                    {m}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-400">
                Payments secured by Razorpay.<br />Prepaid orders only.
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-8 flex flex-col items-center justify-between gap-2 border-t border-gray-200 pt-6 text-xs text-gray-400 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} {STORE.name}. All rights reserved.</p>
            <p>Made in Himachal Pradesh</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
