"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { STORE } from "@/lib/constants";
import { getCart, cartCount } from "@/lib/cart";

export function StoreHeader() {
  const [count, setCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { push } = useRouter();
  const pathname = usePathname();
  const searchRef = useRef<HTMLInputElement>(null);

  // Close mobile menus on route change
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMobileMenuOpen(false); setMobileSearchOpen(false); }, [pathname]);

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
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "border-b border-gray-200 bg-white shadow-sm"
            : "bg-white"
        }`}
      >
        {/* Announcement bar */}
        <div className="bg-brand-700 px-4 py-1.5 text-center text-xs text-white">
          Free delivery on orders above 2kg &bull; Straight from Sundernagar
        </div>

        {/* Main nav */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
          {/* Mobile menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 lg:hidden"
            aria-label="Menu"
          >
            <div className="relative h-5 w-5">
              <span className={`absolute left-0 top-0.5 h-0.5 w-5 rounded bg-current transition-all duration-300 ${mobileMenuOpen ? "top-2 rotate-45" : ""}`} />
              <span className={`absolute left-0 top-2 h-0.5 w-5 rounded bg-current transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-3.5 h-0.5 w-5 rounded bg-current transition-all duration-300 ${mobileMenuOpen ? "top-2 -rotate-45" : ""}`} />
            </div>
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-700 text-sm font-bold text-white">
              S
            </span>
            <span className="text-lg font-bold tracking-tight text-gray-900">
              {STORE.name}
            </span>
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="relative hidden flex-1 lg:block lg:mx-8 lg:max-w-lg">
            <div className="relative flex">
              <input
                name="q"
                placeholder="Search for honey, spices, oils..."
                className="w-full rounded-lg rounded-r-none border border-r-0 border-gray-300 bg-white py-2 pl-4 pr-4 text-sm text-gray-700 placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="flex items-center justify-center rounded-r-lg bg-brand-600 px-4 text-white transition-colors hover:bg-brand-700"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
              className="relative flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 sm:px-3"
            >
              <div className="relative">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
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
                className="w-full rounded-lg rounded-r-none border border-r-0 border-gray-300 bg-white py-2.5 pl-4 pr-4 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="submit"
                className="flex items-center justify-center rounded-r-lg bg-brand-600 px-4 text-white"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="animate-slide-down fixed left-4 right-4 top-[104px] z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg lg:hidden">
            <nav className="flex flex-col p-1.5">
              {[
                { href: "/", label: "Shop All Products", icon: "M4 6h16M4 12h8m-8 6h16" },
                { href: "/cart", label: `Cart${count > 0 ? ` (${count})` : ""}`, icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
                { href: "/order-history", label: "Track Order", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-gray-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-gray-100 px-4 py-3">
              <div className="text-xs text-gray-400">
                {STORE.city}, {STORE.state} &bull; {STORE.domain}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
