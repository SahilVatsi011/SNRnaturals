import Link from "next/link";
import { getActiveProducts } from "@/lib/products";
import { ProductCard } from "@/components/store/ProductCard";
import { STORE } from "@/lib/constants";

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
    <div className="overflow-hidden">
      {/* ━━━━━━━━━━ HERO ━━━━━━━━━━ */}
      <section className="relative min-h-[520px] sm:min-h-[580px] lg:min-h-[640px]">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2e1f] via-[#0d3b28] to-[#134e35]" />

        {/* Animated orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="blob absolute -right-20 -top-20 h-[500px] w-[500px] bg-brand-500/10 blur-3xl animate-pulse-slow" />
          <div className="blob absolute -bottom-32 -left-20 h-[400px] w-[400px] bg-brand-400/8 blur-3xl animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
          <div className="blob absolute right-1/4 top-1/3 h-[200px] w-[200px] bg-warm-300/6 blur-2xl animate-float" />
        </div>

        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`
        }} />

        {/* Content */}
        <div className="relative mx-auto flex max-w-7xl flex-col justify-center px-5 py-16 sm:px-8 sm:py-20 lg:flex-row lg:items-center lg:gap-12 lg:px-8 lg:py-24">
          <div className="max-w-2xl lg:max-w-xl">
            {/* Badge */}
            <div className="animate-fade-in inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
              </span>
              <span className="text-sm font-medium text-brand-200">
                Farm Fresh from {STORE.city}, HP
              </span>
            </div>

            {/* Heading */}
            <h1 className="animate-fade-in-up delay-100 mt-6 font-display text-[40px] font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              Nature&apos;s Finest,
              <br />
              <span className="text-gradient-gold italic">Delivered Fresh</span>
            </h1>

            {/* Subtitle */}
            <p className="animate-fade-in-up delay-200 mt-5 max-w-md text-base leading-relaxed text-white/60 sm:text-lg">
              Pure honey, cold-pressed oils, handpicked spices &amp; superfoods
              — straight from the Himalayan valleys. No chemicals, no shortcuts.
            </p>

            {/* CTA Buttons */}
            <div className="animate-fade-in-up delay-300 mt-8 flex flex-wrap gap-3">
              <Link
                href="#products"
                className="group inline-flex items-center gap-2.5 rounded-full bg-brand-500 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-400 hover:shadow-xl hover:shadow-brand-400/30"
              >
                Explore Products
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/order-history"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white/90 backdrop-blur-sm transition-all duration-300 hover:border-white/30 hover:bg-white/10"
              >
                Track Your Order
              </Link>
            </div>

            {/* Stats */}
            <div className="animate-fade-in-up delay-400 mt-10 flex gap-8">
              {[
                { value: `${products.length}+`, label: "Products" },
                { value: "100%", label: "Natural" },
                { value: "Pan-India", label: "Delivery" },
              ].map((s) => (
                <div key={s.label}>
                  <div className="text-xl font-bold text-white sm:text-2xl">{s.value}</div>
                  <div className="text-xs text-white/40 sm:text-sm">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Hero visual — floating product collage */}
          <div className="mt-10 hidden lg:mt-0 lg:block lg:flex-1">
            <div className="relative h-[420px] w-full">
              {products.slice(0, 3).map((p, i) => {
                const positions = [
                  "top-0 right-8 rotate-3",
                  "top-24 right-48 -rotate-6",
                  "top-52 right-4 rotate-2",
                ];
                return p.images?.[0] ? (
                  <div key={p.id} className={`absolute ${positions[i]} animate-float`} style={{ animationDelay: `${i * 0.8}s` }}>
                    <div className="overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-black/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        className="h-40 w-40 object-cover sm:h-44 sm:w-44"
                      />
                    </div>
                    <div className="mt-2 rounded-lg bg-white/10 px-3 py-1.5 text-center text-xs font-medium text-white/80 backdrop-blur-md">
                      {p.name}
                    </div>
                  </div>
                ) : null;
              })}
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute -bottom-1 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full">
            <path d="M0 60V30C240 5 480 0 720 15C960 30 1200 50 1440 30V60H0Z" fill="#fafaf8" />
          </svg>
        </div>
      </section>

      {/* ━━━━━━━━━━ TRUST BAR ━━━━━━━━━━ */}
      <section className="relative -mt-1 bg-[#fafaf8]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", title: "100% Natural", desc: "No chemicals or additives" },
              { icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4", title: "Secure Packing", desc: "Safe doorstep delivery" },
              { icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z", title: "Online Payments", desc: "UPI, Cards, Net Banking" },
              { icon: "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z", title: "Premium Quality", desc: "Handpicked ingredients" },
            ].map((b, i) => (
              <div
                key={b.title}
                className="group flex items-center gap-3.5 rounded-2xl border border-stone-100 bg-white p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 text-brand-600 transition-colors group-hover:from-brand-100 group-hover:to-brand-200">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={b.icon} />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-stone-800">{b.title}</div>
                  <div className="text-[11px] leading-tight text-stone-400">{b.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━ CATEGORIES ━━━━━━━━━━ */}
      {categories.length > 1 && (
        <section className="mx-auto max-w-7xl px-5 pt-6 sm:px-8 lg:px-8">
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
            <Link
              href="/"
              className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                !category
                  ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                  : "bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700"
              }`}
            >
              All Products
            </Link>
            {categories.map((c) => (
              <Link
                key={c}
                href={`/?category=${encodeURIComponent(c)}`}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                  category === c
                    ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                    : "bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700"
                }`}
              >
                {c}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ━━━━━━━━━━ PRODUCTS GRID ━━━━━━━━━━ */}
      <section id="products" className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-stone-800 sm:text-3xl">
              {category || "Our Products"}
            </h2>
            <p className="mt-1 text-sm text-stone-400">
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
          <div className="rounded-3xl border-2 border-dashed border-stone-200 bg-white p-16 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-stone-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-lg font-medium text-stone-600">No products found</p>
            <p className="mt-1 text-sm text-stone-400">Try another category or browse all products.</p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              View all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p, i) => (
              <div
                key={p.id}
                className="animate-fade-in"
                style={{ animationDelay: `${Math.min(i * 80, 400)}ms`, opacity: 0 }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ━━━━━━━━━━ WHY US ━━━━━━━━━━ */}
      <section className="border-t border-stone-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-stone-800 sm:text-3xl">
              Why Choose SNR Naturals?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-stone-400">
              Every product is sourced from local farmers and artisans in Sundernagar.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                icon: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707",
                title: "Farm to Doorstep",
                desc: "Products are sourced directly from the pristine valleys of Sundernagar, Himachal Pradesh — cutting out middlemen.",
                color: "from-amber-50 to-orange-50",
                iconColor: "text-amber-600",
              },
              {
                icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
                title: "Made with Love",
                desc: "Handpicked, hand-processed, and packed with care. We treat every order like it's for family.",
                color: "from-rose-50 to-pink-50",
                iconColor: "text-rose-500",
              },
              {
                icon: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
                title: "Zero Chemicals",
                desc: "No preservatives, no artificial colors, no pesticides. Just pure, honest, Himalayan goodness.",
                color: "from-brand-50 to-emerald-50",
                iconColor: "text-brand-600",
              },
            ].map((item) => (
              <div
                key={item.title}
                className={`group rounded-3xl bg-gradient-to-br ${item.color} p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className={`mb-4 inline-flex rounded-2xl bg-white p-3 shadow-sm ${item.iconColor}`}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-stone-800">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━ BOTTOM CTA ━━━━━━━━━━ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0a2e1f] to-[#134e35]">
        <div className="absolute inset-0">
          <div className="blob absolute -right-40 -top-40 h-80 w-80 bg-brand-400/10 blur-3xl" />
          <div className="blob absolute -bottom-20 -left-20 h-60 w-60 bg-warm-300/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 py-16 text-center sm:px-8 sm:py-20 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-white sm:text-4xl">
            Ready to taste the difference?
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/50">
            Order now and get pure Himalayan products delivered to your doorstep across India.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="#products"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-semibold text-brand-800 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
            >
              Shop Now
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="transition-transform group-hover:translate-x-0.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/40">
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-brand-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              No preservatives
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-brand-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Farm fresh
            </span>
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="text-brand-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Pan-India delivery
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
