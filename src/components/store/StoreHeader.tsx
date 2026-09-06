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
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled
            ? "border-b border-stone-200/50 bg-white/85 shadow-sm backdrop-blur-2xl"
            : "bg-white"
        }`}
      >
        {/* Announcement bar */}
        <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-700 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
          <span className="inline-flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="hidden sm:inline">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
            Free delivery on orders above 2kg &bull; Straight from Sundernagar
          </span>
        </div>

        {/* Main nav */}
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          {/* Mobile menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-all hover:bg-stone-100 lg:hidden"
            aria-label="Menu"
          >
            <div className="relative h-5 w-5">
              <span className={`absolute left-0 top-0.5 h-0.5 w-5 rounded bg-current transition-all duration-300 ${mobileMenuOpen ? "top-2 rotate-45" : ""}`} />
              <span className={`absolute left-0 top-2 h-0.5 w-5 rounded bg-current transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : ""}`} />
              <span className={`absolute left-0 top-3.5 h-0.5 w-5 rounded bg-current transition-all duration-300 ${mobileMenuOpen ? "top-2 -rotate-45" : ""}`} />
            </div>
          </button>

          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-lg font-bold text-white shadow-lg shadow-brand-600/20 transition-transform duration-300 group-hover:scale-105">
              S
            </span>
            <div className="hidden sm:block">
              <div className="text-lg font-bold tracking-tight text-stone-800">
                {STORE.name}
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-600/70">
                Pure &amp; Natural
              </div>
            </div>
          </Link>

          {/* Desktop search */}
          <form onSubmit={handleSearch} className="relative mx-8 hidden max-w-md flex-1 lg:block">
            <div className="group relative">
              <svg
                className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-brand-500"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                name="q"
                placeholder="Search for honey, spices, oils..."
                className="w-full rounded-2xl border border-stone-200 bg-stone-50/80 py-2.5 pl-11 pr-4 text-sm text-stone-700 transition-all placeholder:text-stone-400 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              />
            </div>
          </form>

          {/* Actions */}
          <nav className="flex items-center gap-1 sm:gap-1.5">
            {/* Mobile search */}
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-600 transition-all hover:bg-stone-100 lg:hidden"
              aria-label="Search"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Desktop nav links */}
            <Link
              href="/"
              className={`hidden rounded-xl px-4 py-2 text-sm font-medium transition-all lg:block ${
                pathname === "/" ? "bg-brand-50 text-brand-700" : "text-stone-500 hover:bg-stone-50 hover:text-stone-700"
              }`}
            >
              Shop
            </Link>
            <Link
              href="/order-history"
              className="hidden rounded-xl px-4 py-2 text-sm font-medium text-stone-500 transition-all hover:bg-stone-50 hover:text-stone-700 lg:block"
            >
              Track Order
            </Link>

            {/* Divider */}
            <div className="mx-1 hidden h-6 w-px bg-stone-200 lg:block" />

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-medium text-stone-600 transition-all hover:bg-stone-100 sm:px-4"
            >
              <div className="relative">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                {count > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] animate-bounce-in items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-sm shadow-brand-600/30">
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
          <div className="animate-slide-down border-t border-stone-100 px-4 py-3 lg:hidden">
            <form onSubmit={handleSearch} className="relative">
              <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchRef}
                name="q"
                placeholder="Search products..."
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-500/10"
              />
            </form>
          </div>
        )}
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="animate-slide-down fixed left-4 right-4 top-[112px] z-50 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl lg:hidden">
            <nav className="flex flex-col p-2">
              {[
                { href: "/", label: "Shop All Products", icon: "M4 6h16M4 12h8m-8 6h16" },
                { href: "/cart", label: `Cart${count > 0 ? ` (${count})` : ""}`, icon: "M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" },
                { href: "/order-history", label: "Track Order", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" },
              ].map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
                >
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} className="text-stone-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="border-t border-stone-100 px-4 py-3">
              <div className="text-xs text-stone-400">
                {STORE.city}, {STORE.state} &bull; {STORE.domain}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
