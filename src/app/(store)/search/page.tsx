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
      <div className="mb-6">
        <Link
          href="/"
          className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-gray-400 transition-colors hover:text-brand-600"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
          </svg>
          Back to shop
        </Link>
        <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
          {q ? "Search Results" : "Search Products"}
        </h1>
        {q && (
          <p className="mt-0.5 text-sm text-gray-500">
            {products.length} {products.length === 1 ? "result" : "results"} for{" "}
            <span className="font-medium text-gray-700">&ldquo;{q}&rdquo;</span>
          </p>
        )}
      </div>

      {/* Results */}
      {products.length === 0 ? (
        q ? (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <div className="mx-auto w-fit rounded-full bg-gray-100 p-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="text-gray-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h2 className="mt-3 text-base font-semibold text-gray-700">
              No results found
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              Try a different search term or browse our catalog.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Browse All Products
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
            <p className="text-sm text-gray-500">Type a search term to find products.</p>
            <Link href="/" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
              Browse all products
            </Link>
          </div>
        )
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
