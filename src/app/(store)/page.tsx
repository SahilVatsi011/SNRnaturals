import Link from "next/link";
import { getActiveProducts } from "@/lib/products";
import { ProductCard } from "@/components/store/ProductCard";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const products = await getActiveProducts();

  const categories = Array.from(
    new Set(products.map((p) => p.category).filter(Boolean) as string[])
  ).sort();

  const filtered = category
    ? products.filter((p) => p.category === category)
    : products;

  return (
    <div>
      {/* ━━━━━━━━━━ HERO ━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-[#050505]">
        {/* ── Aurora layers ── */}
        <div className="pointer-events-none absolute inset-0">
          {/* Primary aurora wave */}
          <div className="hero-aurora-1 absolute -left-1/4 top-0 h-full w-[150%] opacity-60" />
          {/* Secondary aurora wave */}
          <div className="hero-aurora-2 absolute -right-1/4 top-0 h-full w-[150%] opacity-40" />
          {/* Deep glow base */}
          <div
            className="absolute bottom-0 left-1/2 h-[60%] w-[80%] -translate-x-1/2 rounded-full bg-brand-600/20 blur-[150px]"
            style={{ animation: "hero-breathe 6s ease-in-out infinite" }}
          />
        </div>

        {/* ── Floating particles ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="hero-particle absolute rounded-full bg-white"
              style={{
                width: `${1 + (i % 3)}px`,
                height: `${1 + (i % 3)}px`,
                left: `${(i * 5.3) % 100}%`,
                top: `${(i * 7.1 + 10) % 100}%`,
                opacity: 0.15 + (i % 5) * 0.08,
                animation: `hero-float-up ${8 + (i % 6) * 2}s linear infinite`,
                animationDelay: `${(i * 0.7) % 8}s`,
              }}
            />
          ))}
        </div>

        {/* ── Noise texture ── */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`
        }} />

        {/* ── Horizontal light streaks ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="hero-streak absolute left-0 top-[30%] h-px w-full bg-gradient-to-r from-transparent via-brand-400/30 to-transparent" style={{ animationDelay: "0s" }} />
          <div className="hero-streak absolute left-0 top-[60%] h-px w-full bg-gradient-to-r from-transparent via-emerald-300/20 to-transparent" style={{ animationDelay: "2s" }} />
          <div className="hero-streak absolute left-0 top-[80%] h-px w-full bg-gradient-to-r from-transparent via-brand-300/15 to-transparent" style={{ animationDelay: "4s" }} />
        </div>

        {/* ── Vignette ── */}
        <div className="pointer-events-none absolute inset-0" style={{
          background: "radial-gradient(ellipse at center, transparent 40%, rgba(5,5,5,0.8) 100%)"
        }} />

        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16 lg:flex lg:items-center lg:gap-16 lg:px-8 lg:py-20">
          {/* Left content */}
          <div className="max-w-xl lg:flex-1">
            {/* Small badge */}
            <div className="animate-fade-in inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 backdrop-blur-sm">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand-400" />
              </span>
              <span className="text-xs font-medium text-brand-300/80">Fresh from Sundernagar, HP</span>
            </div>

            {/* Heading — compact on mobile */}
            <h1 className="animate-fade-in-up delay-100 mt-4 text-2xl font-bold leading-tight tracking-tight text-white sm:mt-5 sm:text-4xl lg:text-5xl">
              Nature&apos;s Finest,{" "}
              <span className="hero-text-gradient bg-clip-text text-transparent">Delivered Fresh</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up delay-200 mt-3 max-w-md text-[13px] leading-relaxed text-white/50 sm:mt-4 sm:text-base">
              Honey, cold-pressed oils, handpicked spices &amp; superfoods — straight from the Himalayan valleys.
            </p>

            {/* CTA */}
            <div className="animate-fade-in-up delay-300 mt-6 flex flex-wrap items-center gap-3 sm:mt-7">
              <Link
                href="#products"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:bg-brand-400 hover:shadow-brand-400/25 sm:px-6 sm:py-3"
              >
                {/* Shine sweep on hover */}
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                <span className="relative">Shop Now</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="relative transition-transform group-hover:translate-x-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/order-history"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-white/60 transition-all hover:border-white/25 hover:text-white/90 sm:px-6 sm:py-3"
              >
                Track Order
              </Link>
            </div>

            {/* Stats row */}
            <div className="animate-fade-in-up delay-400 mt-6 flex gap-6 border-t border-white/[0.06] pt-5 sm:mt-8 sm:gap-8 sm:pt-6">
              {[
                { value: `${products.length}+`, label: "Products" },
                { value: "100%", label: "Natural" },
                { value: "Pan-India", label: "Delivery" },
              ].map((s, i) => (
                <div key={s.label} style={{ animationDelay: `${0.5 + i * 0.1}s` }} className="animate-fade-in-up opacity-0">
                  <div className="text-base font-bold text-white sm:text-xl">{s.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-white/30 sm:text-xs">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side — product showcase (desktop only) */}
          {products.length >= 3 && (
            <div className="hidden lg:block lg:flex-1">
              <div className="relative mx-auto w-80">
                {/* Main product card */}
                <div className="animate-fade-in-up delay-200 relative z-10 overflow-hidden rounded-xl border border-white/10 bg-white/5 p-2 shadow-2xl shadow-black/20 backdrop-blur-sm">
                  {products[0]?.images?.[0] && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={products[0].images[0]}
                        alt={products[0].name}
                        className="h-56 w-full rounded-lg object-cover"
                      />
                      <div className="mt-2 px-1">
                        <p className="text-sm font-medium text-white">{products[0].name}</p>
                        <p className="text-xs text-white/50">₹{products[0].price}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Floating smaller cards */}
                {products[1]?.images?.[0] && (
                  <div className="animate-fade-in delay-400 absolute -left-16 top-8 z-0 h-28 w-28 overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-xl shadow-black/10 backdrop-blur-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={products[1].images[0]} alt={products[1].name} className="h-full w-full object-cover" />
                  </div>
                )}
                {products[2]?.images?.[0] && (
                  <div className="animate-fade-in delay-500 absolute -right-12 bottom-12 z-20 h-24 w-24 overflow-hidden rounded-lg border border-white/10 bg-white/5 shadow-xl shadow-black/10 backdrop-blur-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={products[2].images[0]} alt={products[2].name} className="h-full w-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ━━━━━━━━━━ TRUST BAR ━━━━━━━━━━ */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-3 text-xs text-gray-500 sm:text-sm">
          {[
            { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", text: "100% Natural" },
            { icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", text: "Secure Packing" },
            { icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", text: "Online Payments" },
            { icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", text: "Premium Quality" },
          ].map((b) => (
            <span key={b.text} className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="text-brand-600">
                <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
              </svg>
              {b.text}
            </span>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━ CATEGORIES ━━━━━━━━━━ */}
      {categories.length > 1 && (
        <section className="mx-auto max-w-7xl px-5 pt-6 sm:px-8 lg:px-8">
          <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-gray-200 pb-px">
            <Link
              href="/"
              className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                !category
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              All Products
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/?category=${encodeURIComponent(c)}`}
                className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  category === c
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ━━━━━━━━━━ PRODUCTS GRID ━━━━━━━━━━ */}
      <section id="products" className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10 lg:px-8">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              {category || "Our Products"}
            </h2>
            <p className="mt-0.5 text-sm text-gray-400">
              {filtered.length} {filtered.length === 1 ? "product" : "products"} available
            </p>
          </div>
          {category && (
            <Link href="/" className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700">
              View all &rarr;
            </Link>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-14 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-600">No products found</p>
            <p className="mt-1 text-sm text-gray-400">Try another category or browse all products.</p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              View all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ━━━━━━━━━━ WHY US ━━━━━━━━━━ */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:px-8">
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Why Choose SNR Naturals?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-gray-500">
              Every product is sourced from local farmers and artisans in Sundernagar.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707",
                title: "Farm to Doorstep",
                desc: "Products sourced directly from Sundernagar valleys — no middlemen.",
              },
              {
                icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
                title: "Made with Love",
                desc: "Handpicked, hand-processed, and packed with care for every order.",
              },
              {
                icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
                title: "Zero Chemicals",
                desc: "No preservatives, no artificial colors — pure Himalayan goodness.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-lg bg-white p-6 text-center shadow-sm"
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━ BOTTOM CTA ━━━━━━━━━━ */}
      <section className="bg-brand-700 py-8 text-center sm:py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-8">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Ready to taste the difference?
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Order now and get pure Himalayan products delivered across India.
          </p>
          <Link
            href="#products"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-brand-700 transition-colors hover:bg-gray-100"
          >
            Shop Now
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}
