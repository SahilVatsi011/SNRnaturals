import Link from "next/link";
import { getActiveProducts, type Product } from "@/lib/products";
import { ProductCard } from "@/components/store/ProductCard";
import { LogoMark } from "@/components/Logo";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

const highlights = [
  {
    icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    title: "100% Natural",
    desc: "No preservatives or artificial colours",
  },
  {
    icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    title: "Packed with care",
    desc: "Sealed and packed securely by hand",
  },
  {
    icon: "M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z",
    title: "Secure payments",
    desc: "UPI, cards & net banking via Razorpay",
  },
  {
    icon: "M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0",
    title: "Pan-India delivery",
    desc: "Shipped straight from Sundernagar",
  },
];

/** Pick up to `n` products with photos, preferring one per category for variety. */
const SHOWCASE_ORDER = ["honey", "ghee", "pickle", "juice", "spices", "spice", "sweetener"];

function pickShowcase(products: Product[], n: number): Product[] {
  const rank = (p: Product) => {
    const i = SHOWCASE_ORDER.indexOf((p.category ?? "").toLowerCase());
    return i === -1 ? SHOWCASE_ORDER.length : i;
  };
  const withImg = products.filter((p) => p.images?.[0]).sort((x, y) => rank(x) - rank(y));
  const seen = new Set<string>();
  const picked: Product[] = [];
  for (const p of withImg) {
    const key = (p.category ?? "").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push(p);
    if (picked.length === n) return picked;
  }
  for (const p of withImg) {
    if (picked.length === n) break;
    if (!picked.includes(p)) picked.push(p);
  }
  return picked;
}

function CollageTile({
  product,
  className = "",
  label = false,
}: {
  product?: Product;
  className?: string;
  label?: boolean;
}) {
  if (!product) return <div className={`rounded-2xl bg-cream-200 ${className}`} />;
  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group relative block overflow-hidden rounded-2xl bg-cream-100 shadow-sm ring-1 ring-black/5 ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={product.images[0]}
        alt={product.name}
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      {label && (
        <span className="absolute bottom-3 left-3 right-3 truncate rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-ink shadow-sm backdrop-blur">
          {product.name} · {formatINR(product.price)}
        </span>
      )}
    </Link>
  );
}

function HeroCard({
  product,
  className = "",
  featured = false,
}: {
  product: Product;
  className?: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className={`group absolute block rounded-[1.25rem] bg-white p-1.5 shadow-xl shadow-black/10 ring-1 ring-black/5 transition-transform duration-300 hover:-translate-y-1 sm:p-2 ${className}`}
    >
      <span className="block aspect-[4/5] overflow-hidden rounded-2xl bg-cream-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      </span>
      <span className="flex items-center justify-between gap-2 px-1.5 pb-1 pt-2">
        <span className={`truncate font-medium text-ink ${featured ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"}`}>
          {product.name}
        </span>
        <span className={`shrink-0 font-bold text-brand-700 ${featured ? "text-xs sm:text-sm" : "text-[10px] sm:text-xs"}`}>
          {formatINR(product.price)}
        </span>
      </span>
    </Link>
  );
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const products = await getActiveProducts();

  // Group categories case-insensitively so "Honey" and "honey" show once.
  const norm = (c?: string | null) => (c ?? "").trim().toLowerCase();
  const categories = Array.from(
    new Set(products.map((p) => norm(p.category)).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const categoryImage = (c: string) =>
    products.find((p) => norm(p.category) === c && p.images?.[0])?.images[0];

  const filtered = category
    ? products.filter((p) => norm(p.category) === norm(category))
    : products;

  const [a, b, c] = pickShowcase(products, 3);
  const honeyPrices = products
    .filter((p) => norm(p.category) === "honey")
    .map((p) => Number(p.price));
  const honeyFrom = honeyPrices.length ? Math.min(...honeyPrices) : null;
  const minPrice = products.length ? Math.min(...products.map((p) => Number(p.price))) : null;
  const promise = pickShowcase(products, 6).slice(3);

  return (
    <div className="bg-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-cream-50">
        {/* soft decorative blobs */}
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-honey-100/70 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-8 px-4 py-8 sm:px-6 sm:py-14 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:px-8 lg:py-20">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-black/5">
              <LogoMark className="h-3.5 text-brand-700" />
              From Sundernagar, Himachal Pradesh
            </p>
            <h1 className="mt-5 text-[2rem] font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.4rem]">
              Pure Himalayan goodness,{" "}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10">straight to you.</span>
                <span className="absolute inset-x-0 bottom-1 -z-0 h-3 rounded-full bg-honey-100 sm:h-4" />
              </span>
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-gray-600 sm:mt-5 sm:text-base">
              Honey, ghee, pickles, spices and pulses — made in small batches by
              local farmers in the valleys of Himachal.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
              <Link
                href="#products"
                className="inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
              >
                Shop products
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/order-history"
                className="inline-flex items-center rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-400"
              >
                Track an order
              </Link>
            </div>

            <dl className="mt-10 hidden gap-8 border-t border-cream-200 pt-6 sm:flex">
              {[
                { v: `${products.length}+`, l: "Products" },
                { v: `${categories.length}`, l: "Categories" },
                { v: "100%", l: "Natural" },
              ].map((s) => (
                <div key={s.l}>
                  <dt className="text-2xl font-bold text-ink">{s.v}</dt>
                  <dd className="text-xs uppercase tracking-wider text-gray-500">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Product showcase — fanned photo cards */}
          {a && (
            <div className="relative mx-auto h-[390px] w-full max-w-[560px] sm:h-[480px] lg:h-[520px]">
              {/* soft backdrop */}
              <div className="absolute left-1/2 top-1/2 aspect-square w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-honey-100 via-cream-100 to-brand-50" />
              <LogoMark className="absolute right-[4%] top-[4%] h-10 rotate-12 text-brand-700/15 sm:h-14" />
              <LogoMark className="absolute bottom-[10%] left-[2%] h-8 -rotate-12 text-honey-500/25 sm:h-12" />

              {b && <HeroCard product={b} className="left-[2%] top-[16%] w-[37%] -rotate-[9deg] sm:left-[4%]" />}
              {c && <HeroCard product={c} className="right-[2%] top-[16%] w-[37%] rotate-[9deg] sm:right-[4%]" />}
              <HeroCard product={a} featured className="left-1/2 top-[3%] z-10 w-[46%] -translate-x-1/2" />

              {/* floating chips */}
              <div className="absolute bottom-0 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full bg-white py-2 pl-2 pr-4 shadow-lg ring-1 ring-black/5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-700">
                  <LogoMark className="h-5 text-white" />
                </span>
                <span className="text-xs font-semibold text-ink sm:text-sm">Farm fresh · Packed to order</span>
              </div>
              {minPrice !== null && (
                <div className="absolute left-0 top-[4%] z-20 hidden rounded-2xl bg-ink px-4 py-2.5 text-white shadow-lg sm:block">
                  <p className="text-[10px] uppercase tracking-wider text-white/60">Starting at</p>
                  <p className="text-lg font-bold leading-tight">{formatINR(minPrice)}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Highlights ── */}
      <section className="border-b border-gray-100">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
          {highlights.map((h) => (
            <div key={h.title} className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cream-100 text-honey-700">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={h.icon} />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{h.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-500">{h.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Honey feature (video) ── */}
      <section className="mx-auto max-w-7xl px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
        <div className="relative isolate overflow-hidden rounded-3xl bg-[#2a1a06]">
          {/* poster shows instantly / for reduced-motion users; video plays on top */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/media/honey-drip.jpg"
            alt=""
            className="absolute inset-y-0 right-0 -z-20 h-full w-full object-cover sm:w-[62%]"
          />
          <video
            className="absolute inset-y-0 right-0 -z-10 h-full w-full object-cover motion-reduce:hidden sm:w-[62%]"
            src="/media/honey-drip.mp4"
            poster="/media/honey-drip.jpg"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-black/5 sm:bg-gradient-to-r sm:from-[#2a1a06] sm:from-40% sm:via-[#2a1a06]/60 sm:via-55% sm:to-transparent sm:to-75%" />

          <div className="flex min-h-[340px] flex-col justify-end p-6 sm:min-h-[380px] sm:max-w-md sm:justify-center sm:p-12 lg:max-w-lg lg:min-h-[420px]">
            <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur">
              <LogoMark className="h-3.5 text-honey-100" />
              Straight from the hive
            </p>
            <h2 className="mt-4 text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
              Raw Himalayan honey,
              <span className="block text-honey-100">pure &amp; unprocessed.</span>
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/80 sm:text-base">
              Collected from the forests around Sundernagar and bottled without heating or
              additives — just the way nature made it.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/?category=honey#products"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-honey-100"
              >
                Shop honey
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              {honeyFrom !== null && (
                <span className="text-sm text-white/80">
                  from <span className="font-semibold text-white">{formatINR(honeyFrom)}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Shop by category ── */}
      {categories.length > 1 && (
        <section id="categories" className="mx-auto max-w-7xl scroll-mt-28 px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Shop by category</h2>
          <div className="no-scrollbar -mx-4 mt-4 flex gap-5 overflow-x-auto px-4 py-2 sm:-mx-1 sm:px-1">
            <Link href="/#products" className="group flex w-20 shrink-0 flex-col items-center gap-2 sm:w-24">
              <span
                className={`flex h-20 w-20 items-center justify-center rounded-full bg-brand-700 ring-2 ring-offset-2 transition sm:h-24 sm:w-24 ${
                  !category ? "ring-brand-700" : "ring-transparent group-hover:ring-gray-200"
                }`}
              >
                <LogoMark className="h-9 text-white sm:h-11" />
              </span>
              <span className={`text-center text-xs font-medium sm:text-sm ${!category ? "text-ink" : "text-gray-600"}`}>
                All
              </span>
            </Link>
            {categories.map((cat) => {
              const img = categoryImage(cat);
              const active = norm(category) === cat;
              return (
                <Link
                  key={cat}
                  href={`/?category=${encodeURIComponent(cat)}#products`}
                  className="group flex w-20 shrink-0 flex-col items-center gap-2 sm:w-24"
                >
                  <span
                    className={`h-20 w-20 overflow-hidden rounded-full bg-cream-100 ring-2 ring-offset-2 transition sm:h-24 sm:w-24 ${
                      active ? "ring-brand-700" : "ring-transparent group-hover:ring-gray-200"
                    }`}
                  >
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">
                        <LogoMark className="h-8 text-cream-200" />
                      </span>
                    )}
                  </span>
                  <span className={`line-clamp-2 text-center text-xs font-medium capitalize sm:text-sm ${active ? "text-ink" : "text-gray-600"}`}>
                    {cat}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Products ── */}
      <section id="products" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold capitalize tracking-tight text-ink sm:text-2xl">
              {category || "All products"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? "product" : "products"}
            </p>
          </div>
          {category && (
            <Link href="/#products" className="text-sm font-medium text-gray-600 underline-offset-4 hover:text-ink hover:underline">
              View all
            </Link>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-gray-200 p-14 text-center">
            <LogoMark className="mx-auto h-10 text-gray-300" />
            <p className="mt-4 text-base font-medium text-gray-700">No products found</p>
            <p className="mt-1 text-sm text-gray-500">Try another category or browse everything.</p>
            <Link
              href="/#products"
              className="mt-5 inline-flex rounded-full bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800"
            >
              View all products
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* ── Our promise ── */}
      <section className="px-4 pb-14 sm:px-6 sm:pb-20 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-cream-100">
          <div className="grid items-center gap-10 p-8 sm:p-12 lg:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-honey-700">Our promise</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                Made in small batches, the way it&apos;s been done for generations.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-gray-600">
                Every product is sourced from local farmers and artisans in Sundernagar
                and packed by hand when you order — nothing sits in a warehouse.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  "Farm to doorstep — no middlemen",
                  "Handpicked and hand-processed",
                  "No preservatives, no artificial colours",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-sm text-gray-700">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-brand-700 shadow-sm">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {promise.map((p, i) => (
                <CollageTile
                  key={p.id}
                  product={p}
                  className={`aspect-[3/4] ${i === 1 ? "translate-y-6" : ""}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
