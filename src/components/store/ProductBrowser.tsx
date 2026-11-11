"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import type { Product } from "@/lib/products";
import { ProductCard } from "@/components/store/ProductCard";
import { LogoMark } from "@/components/Logo";

interface BrowserProps {
  products: Product[];
  /** Lower-cased, de-duplicated category names. */
  categories: string[];
  /** First product photo per category (for the round category tiles). */
  categoryImages: Record<string, string | undefined>;
}

const norm = (c?: string | null) => (c ?? "").trim().toLowerCase();

/**
 * "Shop by category" + product grid. Filtering by `?category=` happens in the
 * browser, so the homepage itself stays static and is served from the CDN.
 */
export function ProductBrowser(props: BrowserProps) {
  const category = useSearchParams().get("category");
  return <ProductBrowserView {...props} category={category} />;
}

/** Pure view — also used as the Suspense fallback (unfiltered) while hydrating. */
export function ProductBrowserView({
  products,
  categories,
  categoryImages,
  category,
}: BrowserProps & { category: string | null }) {
  const active = norm(category);
  const filtered = active ? products.filter((p) => norm(p.category) === active) : products;

  return (
    <>
      {categories.length > 1 && (
        <section id="categories" className="mx-auto max-w-7xl scroll-mt-28 px-4 pt-12 sm:px-6 sm:pt-16 lg:px-8">
          <h2 className="text-xl font-bold tracking-tight text-ink sm:text-2xl">Shop by category</h2>
          <div className="no-scrollbar -mx-4 mt-4 flex gap-5 overflow-x-auto px-4 py-2 sm:-mx-1 sm:px-1">
            <CategoryTile href="/#products" label="All" active={!active}>
              <span className="flex h-full w-full items-center justify-center bg-brand-700">
                <LogoMark className="h-9 text-white sm:h-11" />
              </span>
            </CategoryTile>
            {categories.map((cat) => {
              const img = categoryImages[cat];
              return (
                <CategoryTile
                  key={cat}
                  href={`/?category=${encodeURIComponent(cat)}#products`}
                  label={cat}
                  active={active === cat}
                >
                  {img ? (
                    <Image
                      src={img}
                      alt=""
                      fill
                      sizes="96px"
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center">
                      <LogoMark className="h-8 text-cream-200" />
                    </span>
                  )}
                </CategoryTile>
              );
            })}
          </div>
        </section>
      )}

      <section id="products" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-12 sm:px-6 sm:py-14 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold capitalize tracking-tight text-ink sm:text-2xl">
              {active || "All products"}
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {filtered.length} {filtered.length === 1 ? "product" : "products"}
            </p>
          </div>
          {active && (
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
            {filtered.map((p, i) => (
              <ProductCard key={p.id} product={p} priority={i < 4} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function CategoryTile({
  href,
  label,
  active,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="group flex w-20 shrink-0 flex-col items-center gap-2 sm:w-24">
      <span
        className={`relative h-20 w-20 overflow-hidden rounded-full bg-cream-100 ring-2 ring-offset-2 transition sm:h-24 sm:w-24 ${
          active ? "ring-brand-700" : "ring-transparent group-hover:ring-gray-200"
        }`}
      >
        {children}
      </span>
      <span className={`line-clamp-2 text-center text-xs font-medium capitalize sm:text-sm ${active ? "text-ink" : "text-gray-600"}`}>
        {label}
      </span>
    </Link>
  );
}
