import Link from "next/link";
import { AddToCartButton } from "./AddToCartButton";
import type { Product } from "@/lib/products";

function price(n: number) {
  return "\u20B9" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 });
}

export function ProductCard({ product }: { product: Product }) {
  const outOfStock = product.stock_qty <= 0;
  const image = product.images?.[0];
  const hasDiscount = product.mrp > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  return (
    <div className="hover-lift group relative flex flex-col overflow-hidden rounded-3xl border border-stone-100 bg-white">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="img-zoom relative aspect-[4/5] w-full bg-stone-50">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-stone-50 to-stone-100">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.8} className="text-stone-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
        )}

        {/* Overlay gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5 sm:left-3 sm:top-3">
          {hasDiscount && (
            <span className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow-lg shadow-red-500/30 sm:text-xs">
              {discountPct}% OFF
            </span>
          )}
          {outOfStock && (
            <span className="rounded-full bg-stone-800/80 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm sm:text-xs">
              Sold Out
            </span>
          )}
        </div>

        {/* Quick view hint */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-4 opacity-0 transition-all duration-300 group-hover:opacity-100">
          <span className="rounded-full bg-white/90 px-4 py-1.5 text-xs font-semibold text-stone-700 shadow-lg backdrop-blur-sm">
            View Details
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.category && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-600 sm:text-[11px]">
            {product.category}
          </span>
        )}

        <Link href={`/products/${product.slug}`}>
          <h3 className="mt-1 line-clamp-2 text-[13px] font-semibold leading-snug text-stone-800 transition-colors group-hover:text-brand-700 sm:text-sm">
            {product.name}
          </h3>
        </Link>

        {product.weight_grams > 0 && (
          <span className="mt-0.5 text-[10px] text-stone-400 sm:text-[11px]">
            {product.weight_grams >= 1000
              ? `${(product.weight_grams / 1000).toFixed(product.weight_grams % 1000 === 0 ? 0 : 1)} kg`
              : `${product.weight_grams}g`}
          </span>
        )}

        <div className="mt-auto flex items-baseline gap-1.5 pt-2">
          <span className="text-lg font-bold text-stone-900 sm:text-xl">
            {price(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-stone-400 line-through sm:text-xs">
              {price(product.mrp)}
            </span>
          )}
        </div>

        <div className="mt-2">
          {!outOfStock ? (
            <AddToCartButton
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                weight_grams: product.weight_grams,
                image,
              }}
              variant="secondary"
              size="sm"
              className="w-full"
            />
          ) : (
            <button
              disabled
              className="w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-semibold text-stone-400"
            >
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
