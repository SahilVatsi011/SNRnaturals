"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getCart, cartCount } from "@/lib/cart";
import { STORE } from "@/lib/constants";
import { LogoMark } from "@/components/Logo";

const ICONS = {
  home: "M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9.5z",
  grid: "M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 0h6v6h-6v-6z",
  bag: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z",
  box: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  menu: "M4 6h16M4 12h16M4 18h16",
};

function Icon({ d, filled = false }: { d: string; filled?: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      fillOpacity={filled ? 0.12 : undefined}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

const MENU_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact us" },
  { href: "/shipping-policy", label: "Shipping policy" },
  { href: "/refund-policy", label: "Cancellation & refund" },
  { href: "/terms", label: "Terms & conditions" },
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/pricing", label: "Pricing" },
];

/**
 * App-style bottom navigation for phones/tablets (hidden on desktop).
 * "Menu" opens a bottom sheet with the info/policy links.
 */
export function MobileTabBar() {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    let first = true;
    function refresh() {
      setCount(cartCount(getCart()));
      if (!first) {
        setBump(true);
        setTimeout(() => setBump(false), 400);
      }
      first = false;
    }
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("snr:cart", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("snr:cart", refresh);
    };
  }, []);

  // Close the sheet whenever the route changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setSheetOpen(false), [pathname]);

  // Lock page scroll while the sheet is open
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [sheetOpen]);

  const tabs = [
    { href: "/", label: "Home", icon: ICONS.home, active: pathname === "/" },
    { href: "/#categories", label: "Categories", icon: ICONS.grid, active: false },
    { href: "/cart", label: "Cart", icon: ICONS.bag, active: pathname.startsWith("/cart") || pathname.startsWith("/checkout"), badge: count },
    { href: "/order-history", label: "Orders", icon: ICONS.box, active: pathname.startsWith("/order-history") || pathname.startsWith("/track") },
  ];

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200/80 bg-white/95 backdrop-blur-md lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <div className="mx-auto grid h-16 max-w-md grid-cols-5">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
                t.active ? "text-brand-700" : "text-gray-500 active:text-ink"
              }`}
            >
              {t.active && (
                <span className="absolute top-0 h-0.5 w-8 rounded-full bg-brand-700" />
              )}
              <span className={`relative ${t.badge && bump ? "animate-bounce-in" : ""}`}>
                <Icon d={t.icon} filled={t.active} />
                {!!t.badge && (
                  <span className="absolute -right-2.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-honey-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {t.badge}
                  </span>
                )}
              </span>
              {t.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
              sheetOpen ? "text-brand-700" : "text-gray-500"
            }`}
          >
            <Icon d={ICONS.menu} />
            Menu
          </button>
        </div>
      </nav>

      {/* Bottom sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="animate-fade-in absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div
            className="animate-slide-up absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
          >
            <div className="flex justify-center pt-3">
              <span className="h-1 w-10 rounded-full bg-gray-300" />
            </div>

            <div className="flex items-center justify-between px-5 pb-4 pt-3">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-700">
                  <LogoMark className="h-7 text-white" />
                </span>
                <div>
                  <p className="font-bold text-ink">SNR Naturals</p>
                  <p className="text-xs text-gray-500">{STORE.city}, {STORE.state}</p>
                </div>
              </div>
              <button
                onClick={() => setSheetOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600"
                aria-label="Close menu"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-3 px-5">
              {[
                { href: "/search", label: "Search", icon: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" },
                { href: "/order-history", label: "My orders", icon: ICONS.box },
                { href: "/contact", label: "Help", icon: "M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
              ].map((q) => (
                <Link
                  key={q.label}
                  href={q.href}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-cream-50 py-4 text-xs font-medium text-ink ring-1 ring-cream-200 active:bg-cream-100"
                >
                  <span className="text-honey-700"><Icon d={q.icon} /></span>
                  {q.label}
                </Link>
              ))}
            </div>

            <ul className="mt-4 divide-y divide-gray-100 px-5">
              {MENU_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex items-center justify-between py-3.5 text-sm text-gray-700 active:text-ink">
                    {l.label}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-gray-400">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>

            <p className="mt-2 px-5 text-xs text-gray-400">
              Secure payments by Razorpay · Prepaid orders only
            </p>
          </div>
        </div>
      )}
    </>
  );
}
