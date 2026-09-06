import Link from "next/link";
import { searchProducts } from "@/lib/products";
import { ProductCard } from "@/components/store/ProductCard";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const products = q ? await searchProducts(q) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-stone-400 transition-colors hover:text-brand-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Back to shop
        </Link>
        <h1 className="font-display text-2xl font-bold text-stone-800 sm:text-3xl">
          {q ? "Search Results" : "Search Products"}
        </h1>
        {q && (
          <p className="mt-1 text-stone-500">
            {products.length} {products.length === 1 ? "result" : "results"} for{" "}
            <span className="font-semibold text-stone-700">&ldquo;{q}&rdquo;</span>
          </p>
        )}
      </div>

      {/* Results */}
      {products.length === 0 ? (
        q ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-14 text-center">
            <div className="mx-auto w-fit rounded-full bg-stone-100 p-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-stone-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-stone-700">
              No results found
            </h2>
            <p className="mt-1 text-sm text-stone-400">
              Try a different search term or browse our catalog.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition-all hover:-translate-y-0.5 hover:bg-brand-700"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-14 text-center">
            <p className="text-stone-500">Type a search term to find products.</p>
            <Link href="/" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
              Browse all products
            </Link>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 60}ms`, opacity: 0 }}>
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
