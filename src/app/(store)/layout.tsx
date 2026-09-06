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
      <footer className="border-t border-stone-800/50 bg-[#0f1f17] text-stone-400">
        <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 lg:px-8">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-lg shadow-brand-600/20">
                  S
                </span>
                <div>
                  <div className="text-base font-bold text-white">{STORE.name}</div>
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-500/70">
                    Pure &amp; Natural
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-stone-500">
                Bringing you the finest natural products from the Himalayan
                valleys of Sundernagar, Mandi district.
              </p>
            </div>

            {/* Links */}
            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-stone-500">
                Quick Links
              </h3>
              <ul className="space-y-3 text-sm">
                {[
                  { href: "/", label: "Shop All" },
                  { href: "/cart", label: "Cart" },
                  { href: "/order-history", label: "Track Order" },
                ].map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-stone-500">
                Contact
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="mt-0.5 shrink-0 text-stone-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{STORE.city}, {STORE.district},<br />{STORE.state}</span>
                </li>
                {STORE.phone && (
                  <li className="flex items-center gap-2.5">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="shrink-0 text-stone-600">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href={`tel:${STORE.phone}`} className="transition-colors hover:text-white">{STORE.phone}</a>
                  </li>
                )}
                <li className="flex items-center gap-2.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="shrink-0 text-stone-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  <span>{STORE.domain}</span>
                </li>
              </ul>
            </div>

            {/* Payments */}
            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-stone-500">
                We Accept
              </h3>
              <div className="flex flex-wrap gap-2">
                {["UPI", "Visa / MC", "Net Banking"].map((m) => (
                  <span key={m} className="rounded-xl border border-stone-700/50 bg-stone-800/50 px-3.5 py-2 text-xs font-medium text-stone-400">
                    {m}
                  </span>
                ))}
              </div>
              <p className="mt-4 text-xs leading-relaxed text-stone-600">
                Payments secured by Razorpay.<br />Prepaid orders only.
              </p>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-stone-800/60 pt-6 text-xs text-stone-600 sm:flex-row">
            <p>&copy; {new Date().getFullYear()} {STORE.name}. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              Made with
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-brand-500">
                <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              in Himachal Pradesh
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
