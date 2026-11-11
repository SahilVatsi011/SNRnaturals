"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getCart, cartCount } from "@/lib/cart";
import { Logo } from "@/components/Logo";

export function StoreHeader() {
  const [count, setCount] = useState(0);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { push } = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);

  // Close mobile menus on route change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileSearchOpen(false); }, [pathname]);

  useEffect(() => {
    function refresh() { setCount(cartCount(getCart())); }
    refresh();
    window.addEventListener("storage", refresh);
    window.addEventListener("snr:cart", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("snr:cart", refresh);
    };
  }, [pathname]);

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 10); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileSearchOpen && searchRef.current) searchRef.current.focus();
  }, [mobileSearchOpen]);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get("q") as string;
    push(q ? `/search?q=${encodeURIComponent(q)}` : "/");
    setMobileSearchOpen(false);
  }

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white/95 backdrop-blur transition-all duration-300 ${
          scrolled
            ? "border-b border-gray-200 bg-white shadow-sm"
            : "bg-white"
        }`}
      >
        {/* Announcement bar */}
        <div className="bg-ink px-4 py-2 text-center text-xs font-medium text-white/90">
          Free delivery on orders above 2kg<span className="hidden sm:inline"> &bull; Straight from Sundernagar</span>
        </div>

        {/* Main nav */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link href="/" className="text-brand-700" aria-label="SNR Naturals home">
            <Logo markClassName="h-9" textClassName="text-lg text-gray-900" />
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="relative hidden flex-1 lg:block lg:mx-8 lg:max-w-lg">
            <div className="relative flex">
              <input
                name="q"
                placeholder="Search for honey, spices, oils..."
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-5 pr-12 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1 top-1 bottom-1 flex w-9 items-center justify-center rounded-full bg-ink text-white transition-colors hover:bg-brand-800"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>

          {/* Actions */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            {/* Mobile search */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
              aria-label="Search"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Desktop nav links */}
            <Link
              href="/"
              className={`hidden px-3 py-2 text-sm font-medium transition-colors lg:block ${
                pathname === "/" ? "text-brand-700" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Shop
            </Link>
            <Link
              href="/order-history"
              className="hidden px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 lg:block"
            >
              Track Order
            </Link>

            {/* Divider */}
            <div className="mx-1 hidden h-5 w-px bg-gray-200 lg:block" />

            {/* Cart */}
            <Link
              href="/cart"
              className="relative hidden h-10 items-center gap-2 rounded-lg px-3 lg:flex text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 sm:px-3"
            >
              <div className="relative">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-honey-500 px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Cart</span>
            </Link>
          </nav>
        </div>

        {/* Mobile search */}
        {mobileSearchOpen && (
          <div className="animate-slide-down border-t border-gray-100 px-4 py-3 lg:hidden">
            <form onSubmit={handleSearch} className="relative flex">
              <input
                ref={searchRef}
                name="q"
                placeholder="Search products..."
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-5 pr-12 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-1 top-1 bottom-1 flex w-9 items-center justify-center rounded-full bg-ink text-white"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </header>
    </>
  );
}
